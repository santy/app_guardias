// Configuración para diferentes entornos
export const config = {
  development: {
    apiUrl: 'http://localhost:5000'
  },
  production: {
    apiUrl: 'https://628ndxl031.execute-api.us-east-1.amazonaws.com/prod'
  }
}

export const getApiUrl = () => {
  return config.production.apiUrl
}
