# Migración a API con Node.js

## Cambios realizados

### 1. Servidor Node.js local (`server.js`)
- Servidor Express simple en puerto 3001
- Endpoint `/api/profesores-guardia` que sirve el JSON
- CORS habilitado para desarrollo

### 2. Servicio de API (`src/services/profesoresService.ts`)
- Abstrae las llamadas fetch
- Manejo de errores centralizado
- Preparado para migración a AWS

### 3. Configuración (`src/config/api.ts`)
- URLs diferentes para desarrollo y producción
- Fácil cambio entre entornos

### 4. Componente actualizado (`TeacherGuards.tsx`)
- Usa hooks para estado de carga y errores
- Llamada asíncrona con useEffect
- Estados de loading y error

## Uso

```bash
# Instalar dependencias
npm install

# Ejecutar servidor y cliente juntos
npm run dev:full

# O por separado:
npm run server  # Puerto 3001
npm run dev     # Puerto 5173
```

## Migración a AWS (API Gateway + Lambda + DynamoDB)

### 1. **Crear tabla DynamoDB**
```bash
# Tabla para ausencias
aws dynamodb create-table \
  --table-name ausencias-profesores \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 2. **Crear función Lambda**
```javascript
// lambda/ausencias-handler.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const params = {
      TableName: 'ausencias-profesores'
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 3. **Configurar API Gateway**
```bash
# Crear API
aws apigateway create-rest-api --name guardias-api

# Crear recurso /ausencias-profesores
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part ausencias-profesores

# Configurar método GET
aws apigateway put-method \
  --rest-api-id YOUR_API_ID \
  --resource-id RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE
```

### 4. **Actualizar configuración del cliente**
```typescript
// src/config/api.ts
export const getApiUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod'
  }
  return 'http://localhost:3001'
}
```

### 5. **Migrar datos JSON a DynamoDB**
```javascript
// scripts/migrate-to-dynamodb.js
const AWS = require('aws-sdk');
const fs = require('fs');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ausencias = JSON.parse(fs.readFileSync('./src/data/ausencias_profesores.json'));

const migrateData = async () => {
  for (const item of ausencias) {
    await dynamodb.put({
      TableName: 'ausencias-profesores',
      Item: item
    }).promise();
  }
};
```

### 6. **Despliegue con AWS CLI**
```bash
# Empaquetar Lambda
zip -r ausencias-lambda.zip lambda/

# Crear función Lambda
aws lambda create-function \
  --function-name ausencias-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler ausencias-handler.handler \
  --zip-file fileb://ausencias-lambda.zip

# Conectar API Gateway con Lambda
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:REGION:ACCOUNT:function:ausencias-handler/invocations
```

### 7. **Costes estimados (500 consultas/día)**
- **DynamoDB**: ~$1.90/mes
- **Lambda**: ~$0.20/mes  
- **API Gateway**: ~$1.50/mes
- **CloudFront** (opcional): ~$0.50/mes
- **Total**: ~$4.10/mes

### 8. **Ventajas de la migración**
- Escalabilidad automática
- Alta disponibilidad
- Costes muy bajos
- Sin mantenimiento de servidor
- Caché integrado con CloudFront

El código del cliente no necesitará cambios adicionales.
