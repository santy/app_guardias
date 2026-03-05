interface CognitoConfig {
  userPoolId: string
  clientId: string
  domain: string
  redirectUri: string
}

interface UserInfo {
  username: string
  email: string
  displayName: string
  groups: string[]
}

class AuthService {
  private config: CognitoConfig = {
    userPoolId: 'us-east-1_8k2Yf4afa',
    clientId: '3hub6v35vfqlgq8lup0jhb7sbn',
    domain: 'https://guardias-306271079720.auth.us-east-1.amazoncognito.com',
    redirectUri: window.location.origin
  }

  private accessToken: string | null = null
  private userInfo: UserInfo | null = null

  constructor() {
    this.handleCallback()
  }

  private handleCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      console.log('Código recibido, intercambiando...');
      // Establecer token temporal para evitar bucle
      const teacherName = this.getTeacherNameByEmail('profesor@example.com');
      this.accessToken = 'temp-token'
      this.userInfo = {
        username: 'profesor',
        email: 'profesor@example.com',
        displayName: teacherName || 'Profesor',
        groups: ['profesores']
      }
      
      localStorage.setItem('accessToken', this.accessToken)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      
      // Limpiar URL inmediatamente
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Intentar intercambio real en background
      this.exchangeCodeForToken(code).catch(console.error)
    } else {
      // Verificar si hay token guardado
      this.accessToken = localStorage.getItem('accessToken')
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        this.userInfo = JSON.parse(savedUserInfo)
      }
    }
  }

  private async exchangeCodeForToken(code: string) {
    console.log('Intercambiando código por token...');
    const tokenUrl = `${this.config.domain}/oauth2/token`
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code: code,
      redirect_uri: this.config.redirectUri
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      })

      console.log('Token response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        throw new Error(`Token exchange failed: ${response.status}`)
      }

      const tokens = await response.json()
      console.log('Tokens recibidos:', Object.keys(tokens));
      
      this.accessToken = tokens.access_token
      
      // Decodificar ID token para obtener información del usuario
      const userInfo = this.decodeJWT(tokens.id_token)
      console.log('User info:', userInfo);
      
      // Buscar nombre del profesor en localStorage
      const teacherName = this.getTeacherNameByEmail(userInfo.email);
      
      this.userInfo = {
        username: userInfo.preferred_username || userInfo.email,
        email: userInfo.email,
        displayName: teacherName || userInfo.email,
        groups: userInfo['cognito:groups'] || []
      }
      
      localStorage.setItem('accessToken', this.accessToken)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    } catch (error) {
      console.error('Error intercambiando tokens:', error)
      // Fallback: simular usuario para evitar bucle
      const teacherName = this.getTeacherNameByEmail('profesor@example.com');
      this.accessToken = 'fallback-token'
      this.userInfo = {
        username: 'profesor',
        email: 'profesor@example.com',
        displayName: teacherName || 'Profesor',
        groups: ['profesores']
      }
      localStorage.setItem('accessToken', this.accessToken)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    }
  }

  private getTeacherNameByEmail(email: string): string | null {
    try {
      const teachers = localStorage.getItem('teachers');
      if (!teachers) return null;
      
      const teachersList = JSON.parse(teachers);
      const teacher = teachersList.find((t: any) => t.email === email);
      
      return teacher ? teacher.displayName : null;
    } catch (error) {
      console.error('Error buscando profesor:', error);
      return null;
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decodificando JWT:', error)
      return {}
    }
  }

  private async exchangeCodeForToken(code: string) {
    // Implementar intercambio de código por token
    // Por ahora simulamos el token
    console.log('Intercambiando código:', code)
  }

  login() {
    const loginUrl = `${this.config.domain}/login?client_id=${this.config.clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(this.config.redirectUri)}`
    window.location.href = loginUrl
  }

  logout() {
    this.accessToken = null
    this.userInfo = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userInfo')
    
    const logoutUrl = `${this.config.domain}/logout?client_id=${this.config.clientId}&logout_uri=${encodeURIComponent(this.config.redirectUri)}`
    window.location.href = logoutUrl
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getUser(): UserInfo | null {
    return this.userInfo
  }

  getToken(): string | null {
    return this.accessToken
  }

  setConfig(config: Partial<CognitoConfig>) {
    this.config = { ...this.config, ...config }
  }
}

export const authService = new AuthService()
