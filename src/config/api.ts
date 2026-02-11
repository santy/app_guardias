// Configuración para diferentes entornos
export const config = {
  development: {
    apiUrl: 'http://localhost:5000'
  },
  production: {
    // Para futuro uso con AWS
    apiUrl: 'https://your-api-gateway-url.amazonaws.com/prod'
  }
}

export const getApiUrl = () => {
  const env = process.env.NODE_ENV || 'development'
  return config[env as keyof typeof config].apiUrl
}
