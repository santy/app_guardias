#!/bin/bash
# Script para corregir CORS en API Gateway

# 1. Primero verifica si el token está llegando correctamente
echo "Verificando token en localStorage..."

# 2. Luego actualiza el CloudFormation con CORS en errores
echo "Necesitas agregar estas líneas a cada método GET en el CloudFormation:"
echo ""
echo "IntegrationResponses:"
echo "  - StatusCode: 200"
echo "    ResponseParameters:"
echo "      method.response.header.Access-Control-Allow-Origin: \"'*'\""
echo "  - StatusCode: 401"
echo "    ResponseParameters:"
echo "      method.response.header.Access-Control-Allow-Origin: \"'*'\""
echo "  - StatusCode: 403"
echo "    ResponseParameters:"
echo "      method.response.header.Access-Control-Allow-Origin: \"'*'\""
echo ""
echo "Y en MethodResponses agregar:"
echo "  - StatusCode: 401"
echo "    ResponseParameters:"
echo "      method.response.header.Access-Control-Allow-Origin: true"
echo "  - StatusCode: 403"
echo "    ResponseParameters:"
echo "      method.response.header.Access-Control-Allow-Origin: true"
