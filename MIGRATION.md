# Migración a AWS: API Gateway + Lambda + DynamoDB

## Estado Actual - Servidor Node.js Local

### Arquitectura Actual
```
Frontend (React) → Node.js Server (Express) → Archivos JSON locales
```

### Endpoints del Servidor Node.js (Puerto 3002)

#### 1. `/api/profesores-guardia` [GET]
**Descripción**: Obtiene la plantilla de profesores de guardia con nombres resueltos
**Archivos fuente**:
- `./src/data/plantilla_profesores_guardia.json`
- `./src/data/teachers.json`

**Lógica de negocio**:
1. Lee plantilla de guardias (estructura: día → hora → array de profesores)
2. Lee datos de profesores para resolver nombres
3. Crea mapa teacherId → información del profesor
4. Transforma plantilla incluyendo nombres completos

**Estructura de respuesta**:
```json
{
  "LUNES": {
    "1": [
      {
        "nombre": "Álvarez Martín, Carlos",
        "guardias": 4,
        "teacherId": "T001"
      }
    ]
  }
}
```

#### 2. `/api/ausencias-profesores` [GET]
**Descripción**: Obtiene ausencias de profesores con nombres resueltos
**Archivos fuente**:
- `./src/data/ausencias_profesores.json`
- `./src/data/teachers.json`

**Lógica de negocio**:
1. Lee ausencias (estructura DynamoDB: PK, SK, atributos)
2. Lee datos de profesores para resolver nombres
3. Enriquece cada ausencia con nombres de profesor ausente y asignado

**Estructura de respuesta**:
```json
[
  {
    "PK": "DATE#2026-02-03#SLOT#01",
    "SK": "T001",
    "aula": "101",
    "comentarios": "Guardia de biblioteca",
    "asignada": true,
    "profesorAsignado": "T002",
    "teacherName": "Álvarez Martín, Carlos",
    "profesorAsignadoNombre": "Benítez Sánchez, Laura"
  }
]
```

### Cliente React - Servicios de Conexión

#### Configuración API (`src/config/api.ts`)
```typescript
export const config = {
  development: { apiUrl: 'http://localhost:3002' },
  production: { apiUrl: 'https://your-api-gateway-url.amazonaws.com/prod' }
}
```

#### Servicio de Profesores (`src/services/profesoresService.ts`)
**Métodos**:
- `getProfesoresGuardia()`: Consume `/api/profesores-guardia`
- `getAusenciasProfesores(weekDate?)`: Consume `/api/ausencias-profesores`

**Características**:
- Cache local con `cacheService`
- Transformación de datos de ausencias por semana
- Manejo de errores centralizado
- Preparado para migración AWS

---

## Plan de Migración a AWS

### Fase 1: Preparación de Datos

#### 1.1 Estructura DynamoDB
**Tabla Principal**: `guardias-profesores`
```
PK (String): Partition Key
SK (String): Sort Key  
GSI1PK (String): Global Secondary Index 1 PK
GSI1SK (String): Global Secondary Index 1 SK
```

**Patrones de acceso**:
- Ausencias: `PK = DATE#YYYY-MM-DD#SLOT#NN`, `SK = TEACHER_ID`
- Profesores: `PK = TEACHER#ID`, `SK = METADATA`
- Plantilla: `PK = SCHEDULE#DAY`, `SK = SLOT#NN`

#### 1.2 Script de Migración de Datos
```javascript
// scripts/migrate-to-dynamodb.js
const AWS = require('aws-sdk');
const fs = require('fs');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Migrar ausencias (ya tienen estructura DynamoDB)
const ausencias = JSON.parse(fs.readFileSync('./src/data/ausencias_profesores.json'));

// Migrar profesores
const teachers = JSON.parse(fs.readFileSync('./src/data/teachers.json'));
const teacherItems = teachers.map(teacher => ({
  PK: teacher.PK,
  SK: 'METADATA',
  displayName: teacher.displayName,
  email: teacher.email,
  active: teacher.active,
  groups: teacher['cognito:groups']
}));

// Migrar plantilla de guardias
const plantilla = JSON.parse(fs.readFileSync('./src/data/plantilla_profesores_guardia.json'));
const plantillaItems = [];
Object.keys(plantilla).forEach(day => {
  Object.keys(plantilla[day]).forEach(slot => {
    plantillaItems.push({
      PK: `SCHEDULE#${day}`,
      SK: `SLOT#${slot.padStart(2, '0')}`,
      teachers: plantilla[day][slot]
    });
  });
});

const migrateData = async () => {
  // Batch write para cada tipo de datos
  const batchWrite = async (items, tableName) => {
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }
    
    for (const batch of batches) {
      await dynamodb.batchWrite({
        RequestItems: {
          [tableName]: batch.map(item => ({
            PutRequest: { Item: item }
          }))
        }
      }).promise();
    }
  };
  
  await batchWrite(ausencias, 'guardias-profesores');
  await batchWrite(teacherItems, 'guardias-profesores');
  await batchWrite(plantillaItems, 'guardias-profesores');
};
```

### Fase 2: Funciones Lambda

#### 2.1 Lambda: Profesores de Guardia
```javascript
// lambda/profesores-guardia-handler.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // 1. Obtener plantilla de guardias
    const scheduleParams = {
      TableName: 'guardias-profesores',
      FilterExpression: 'begins_with(PK, :pk)',
      ExpressionAttributeValues: { ':pk': 'SCHEDULE#' }
    };
    const scheduleResult = await dynamodb.scan(scheduleParams).promise();
    
    // 2. Obtener información de profesores
    const teachersParams = {
      TableName: 'guardias-profesores',
      FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: { 
        ':pk': 'TEACHER#',
        ':sk': 'METADATA'
      }
    };
    const teachersResult = await dynamodb.scan(teachersParams).promise();
    
    // 3. Crear mapa de profesores
    const teacherMap = {};
    teachersResult.Items.forEach(teacher => {
      const teacherId = teacher.PK.replace('TEACHER#', '');
      teacherMap[teacherId] = {
        nombre: teacher.displayName,
        email: teacher.email,
        active: teacher.active
      };
    });
    
    // 4. Transformar plantilla
    const transformedData = {};
    scheduleResult.Items.forEach(item => {
      const day = item.PK.replace('SCHEDULE#', '');
      const slot = item.SK.replace('SLOT#', '').replace(/^0+/, '');
      
      if (!transformedData[day]) transformedData[day] = {};
      
      transformedData[day][slot] = item.teachers.map(teacher => ({
        nombre: teacherMap[teacher.teacherId]?.nombre || `Profesor ${teacher.teacherId}`,
        guardias: teacher.objetivo,
        teacherId: teacher.teacherId
      }));
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300' // 5 minutos
      },
      body: JSON.stringify(transformedData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 2.2 Lambda: Ausencias de Profesores
```javascript
// lambda/ausencias-profesores-handler.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // 1. Obtener ausencias
    const ausenciasParams = {
      TableName: 'guardias-profesores',
      FilterExpression: 'begins_with(PK, :pk)',
      ExpressionAttributeValues: { ':pk': 'DATE#' }
    };
    const ausenciasResult = await dynamodb.scan(ausenciasParams).promise();
    
    // 2. Obtener información de profesores
    const teachersParams = {
      TableName: 'guardias-profesores',
      FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: { 
        ':pk': 'TEACHER#',
        ':sk': 'METADATA'
      }
    };
    const teachersResult = await dynamodb.scan(teachersParams).promise();
    
    // 3. Crear mapa de profesores
    const teacherMap = {};
    teachersResult.Items.forEach(teacher => {
      const teacherId = teacher.PK.replace('TEACHER#', '');
      teacherMap[teacherId] = {
        nombre: teacher.displayName,
        email: teacher.email,
        active: teacher.active
      };
    });
    
    // 4. Enriquecer ausencias con nombres
    const transformedData = ausenciasResult.Items.map(ausencia => ({
      ...ausencia,
      teacherName: teacherMap[ausencia.SK]?.nombre || `Profesor ${ausencia.SK}`,
      profesorAsignadoNombre: ausencia.profesorAsignado ? 
        (teacherMap[ausencia.profesorAsignado]?.nombre || `Profesor ${ausencia.profesorAsignado}`) : 
        null
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=60' // 1 minuto (datos más dinámicos)
      },
      body: JSON.stringify(transformedData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Fase 3: Infraestructura AWS

#### 3.1 Crear Tabla DynamoDB
```bash
aws dynamodb create-table \
  --table-name guardias-profesores \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=GuardiasApp Key=Environment,Value=Production
```

#### 3.2 Crear Funciones Lambda
```bash
# Empaquetar funciones
zip -r profesores-guardia-lambda.zip lambda/profesores-guardia-handler.js
zip -r ausencias-profesores-lambda.zip lambda/ausencias-profesores-handler.js

# Crear rol de ejecución
aws iam create-role \
  --role-name guardias-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Adjuntar políticas
aws iam attach-role-policy \
  --role-name guardias-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name guardias-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

# Crear funciones Lambda
aws lambda create-function \
  --function-name profesores-guardia-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/guardias-lambda-role \
  --handler profesores-guardia-handler.handler \
  --zip-file fileb://profesores-guardia-lambda.zip \
  --timeout 30 \
  --memory-size 256

aws lambda create-function \
  --function-name ausencias-profesores-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/guardias-lambda-role \
  --handler ausencias-profesores-handler.handler \
  --zip-file fileb://ausencias-profesores-lambda.zip \
  --timeout 30 \
  --memory-size 256
```

#### 3.3 Configurar API Gateway
```bash
# Crear API REST
API_ID=$(aws apigateway create-rest-api \
  --name guardias-api \
  --description "API para gestión de guardias de profesores" \
  --query 'id' --output text)

# Obtener root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' --output text)

# Crear recurso /api
API_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part api \
  --query 'id' --output text)

# Crear recurso /api/profesores-guardia
PROFESORES_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part profesores-guardia \
  --query 'id' --output text)

# Crear recurso /api/ausencias-profesores
AUSENCIAS_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part ausencias-profesores \
  --query 'id' --output text)

# Configurar métodos GET
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $PROFESORES_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $AUSENCIAS_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Configurar integraciones con Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $PROFESORES_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:REGION:ACCOUNT_ID:function:profesores-guardia-handler/invocations

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $AUSENCIAS_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:REGION:ACCOUNT_ID:function:ausencias-profesores-handler/invocations

# Dar permisos a API Gateway para invocar Lambda
aws lambda add-permission \
  --function-name profesores-guardia-handler \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:REGION:ACCOUNT_ID:$API_ID/*/*"

aws lambda add-permission \
  --function-name ausencias-profesores-handler \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:REGION:ACCOUNT_ID:$API_ID/*/*"

# Desplegar API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

### Fase 4: Actualización del Cliente

#### 4.1 Actualizar Configuración
```typescript
// src/config/api.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3002'
  },
  production: {
    apiUrl: 'https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod'
  }
}
```

#### 4.2 Variables de Entorno
```bash
# .env.production
VITE_API_URL=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod
```

### Fase 5: Optimizaciones y Monitoreo

#### 5.1 CloudFront para Cache
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "guardias-api-'$(date +%s)'",
    "Comment": "CDN para API de guardias",
    "DefaultCacheBehavior": {
      "TargetOriginId": "guardias-api",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {"Enabled": false, "Quantity": 0},
      "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
      "MinTTL": 0,
      "DefaultTTL": 300,
      "MaxTTL": 3600
    },
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "guardias-api",
        "DomainName": "YOUR_API_ID.execute-api.REGION.amazonaws.com",
        "OriginPath": "/prod",
        "CustomOriginConfig": {
          "HTTPPort": 443,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }'
```

#### 5.2 Monitoreo con CloudWatch
```bash
# Crear alarma para errores Lambda
aws cloudwatch put-metric-alarm \
  --alarm-name "guardias-lambda-errors" \
  --alarm-description "Errores en funciones Lambda de guardias" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Fase 6: Costes y Rendimiento

#### 6.1 Estimación de Costes (500 consultas/día)
- **DynamoDB**: 
  - Almacenamiento: ~1KB × 1000 items = ~$0.25/mes
  - Lecturas: 500 × 30 = 15,000 RCU/mes = ~$1.88/mes
- **Lambda**: 
  - Invocaciones: 15,000/mes = ~$0.003/mes
  - Duración: 15,000 × 200ms × 256MB = ~$0.05/mes
- **API Gateway**: 15,000 requests = ~$0.05/mes
- **CloudFront**: ~$0.50/mes
- **Total estimado**: ~$2.73/mes

#### 6.2 Optimizaciones de Rendimiento
- Cache en Lambda (variables globales)
- Conexiones DynamoDB reutilizables
- Proyecciones específicas en queries
- TTL para datos temporales

### Fase 7: Rollback y Contingencia

#### 7.1 Plan de Rollback
1. Cambiar variable de entorno `VITE_API_URL` a servidor local
2. Reactivar servidor Node.js
3. Verificar funcionamiento
4. Investigar y corregir problemas en AWS

#### 7.2 Monitoreo de Salud
```javascript
// Endpoint de health check
exports.healthCheck = async (event) => {
  try {
    // Test básico de DynamoDB
    await dynamodb.scan({
      TableName: 'guardias-profesores',
      Limit: 1
    }).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'unhealthy',
        error: error.message
      })
    };
  }
};
```

---

## Resumen de Migración

### Ventajas de AWS
- **Escalabilidad**: Automática según demanda
- **Disponibilidad**: 99.9% SLA
- **Costes**: ~$2.73/mes vs servidor dedicado
- **Mantenimiento**: Cero mantenimiento de infraestructura
- **Seguridad**: Gestionada por AWS
- **Cache**: Integrado con CloudFront

### Pasos de Migración
1. ✅ **Preparar datos**: Migrar JSONs a DynamoDB
2. ✅ **Crear Lambdas**: Replicar lógica del servidor Node.js
3. ✅ **Configurar API Gateway**: Exponer endpoints
4. ✅ **Actualizar cliente**: Cambiar URL de producción
5. ✅ **Optimizar**: CloudFront + monitoreo
6. ✅ **Probar**: Verificar funcionalidad completa

### Compatibilidad
- **Sin cambios en el cliente**: Misma interfaz de API
- **Misma estructura de datos**: Respuestas idénticas
- **Rollback rápido**: Cambio de configuración únicamente
