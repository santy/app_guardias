import { getApiUrl } from '../config/api'
import { authService } from './authService'

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(`${getApiUrl()}${endpoint}`, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  async get(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'GET' })
  }

  async post(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiService()
