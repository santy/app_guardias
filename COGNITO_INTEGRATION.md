# Integración de Cognito - Guía de Configuración

## 1. Desplegar CloudFormation

Usar el archivo `api_gateway_cognito.yaml` para crear la infraestructura:

```bash
aws cloudformation create-stack \
  --stack-name guardias-cognito-stack \
  --template-body file://src/cloudformation_files/api_gateway_cognito.yaml \
  --parameters ParameterKey=CodeBucket,ParameterValue=tu-bucket-s3 \
  --region us-east-1
```

## 2. Obtener Outputs de CloudFormation

Después del despliegue, obtener los valores necesarios:

```bash
aws cloudformation describe-stacks \
  --stack-name guardias-cognito-stack \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

**Valores importantes:**
- `UserPoolId`: us-east-1_XXXXXXX
- `UserPoolClientId`: XXXXXXXXXXXXXXXXXX
- `HostedUIURL`: https://guardias-XXXXXX.auth.us-east-1.amazoncognito.com/...

## 3. Configurar Contraseñas de Usuarios

Establecer contraseñas para los usuarios de prueba:

```bash
# Profesor
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXX \
  --username profesor@example.com \
  --password "P@ssw0rd" \
  --permanent

# Jefatura
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXX \
  --username jefatura@example.com \
  --password "P@ssw0rd" \
  --permanent

# Administrador
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXX \
  --username admin@example.com \
  --password "P@ssw0rd" \
  --permanent
```

## 4. Actualizar Configuración de la App

En `src/services/authService.ts`, actualizar la configuración:

```typescript
private config: CognitoConfig = {
  userPoolId: 'us-east-1_XXXXXXX',           // Del output UserPoolId
  clientId: 'XXXXXXXXXXXXXXXXXX',            // Del output UserPoolClientId
  domain: 'https://guardias-XXXXXX.auth.us-east-1.amazoncognito.com',
  redirectUri: window.location.origin
}
```

## 5. Actualizar URL de API

En `src/config/api.ts`, usar la nueva URL del API Gateway:

```typescript
export const getApiUrl = () => {
  return 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod'
}
```

## 6. Configurar Callback URLs

Si cambias el dominio de desarrollo, actualizar en Cognito:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_XXXXXXX \
  --client-id XXXXXXXXXXXXXXXXXX \
  --callback-urls "http://localhost:5173","https://tu-dominio.com" \
  --logout-urls "http://localhost:5173","https://tu-dominio.com"
```

## 7. Usuarios de Prueba

| Usuario | Contraseña | Grupo |
|---------|------------|-------|
| profesor@example.com | P@ssw0rd | profesores |
| jefatura@example.com | P@ssw0rd | jefatura |
| admin@example.com | P@ssw0rd | administradores |

## 8. Flujo de Autenticación

1. Usuario accede a la app
2. Si no está autenticado, se redirige a Cognito Hosted UI
3. Usuario se loguea con email/contraseña
4. Cognito redirige de vuelta con código de autorización
5. App intercambia código por tokens (simulado por ahora)
6. Usuario ve la aplicación con su información en el sidebar

## 9. Comandos Útiles

**Listar usuarios:**
```bash
aws cognito-idp list-users --user-pool-id us-east-1_XXXXXXX
```

**Verificar grupos de un usuario:**
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username profesor@example.com
```

**Eliminar stack:**
```bash
aws cloudformation delete-stack --stack-name guardias-cognito-stack
```

## Notas

- La implementación actual simula el intercambio de tokens por simplicidad
- Para producción, implementar el intercambio real de código por tokens JWT
- Los endpoints de API ahora requieren autenticación Cognito
- El sidebar muestra el usuario logueado y su grupo
