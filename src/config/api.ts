// Configuración para diferentes entornos
export const config = {
  development: {
    apiUrl: 'http://localhost:5000'
  },
  production: {
    apiUrl: 'https://bs353nauqj.execute-api.us-east-1.amazonaws.com/prod'
  }
}

export const getApiUrl = () => {
  // Usar AWS API directamente
  return 'https://dsonjx0r30.execute-api.us-east-1.amazonaws.com/prod'
}
