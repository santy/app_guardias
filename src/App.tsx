import { useState, useEffect } from 'react'
import './App.css'
import GuardSchedule from './components/GuardSchedule'
import TeacherGuards from './components/TeacherGuards'
import ReportAbsence from './components/ReportAbsence'
import UserManagement from './components/UserManagement'
import { networkMonitor } from './utils/networkMonitor'
import { authService } from './services/authService'


function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'teachers' | 'report' | 'users'>('schedule')
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState(networkMonitor.getStats())
  const [user, setUser] = useState(authService.getUser())
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())

  useEffect(() => {
    networkMonitor.init()
    
    // Verificar estado de autenticación
    setIsAuthenticated(authService.isAuthenticated())
    setUser(authService.getUser())
    
    // Actualizar stats cada segundo
    const interval = setInterval(() => {
      if (showStats) {
        setStats(networkMonitor.getStats())
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [showStats])

  const handleClearCache = () => {
    if (confirm('¿Resetear caché?')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const handleLogout = () => {
    authService.logout()
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Sistema de Guardias - Instituto</h1>
          <p>Necesitas iniciar sesión para acceder</p>
          <button onClick={() => authService.login()}>Iniciar Sesión</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="sidebar">
        <span className="user-info">
          {user?.displayName || user?.email || 'Desconocido'} - {user?.email} ({user?.groups?.join(', ') || 'Sin grupo'}) {user?.teacherId && `| ID: ${user.teacherId}`} | <button onClick={handleLogout} className="logout-btn">Salir</button>
        </span>
      </div>
      <div className="main-content">
        <header className="app-header">
          <h1>Sistema de Guardias - Instituto</h1>
          <nav className="tabs">
            <button 
              className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Horario Semanal
            </button>
            <button 
              className={`tab ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              Profesores de Guardia
            </button>
            <button 
              className={`tab ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              Reportar Ausencia
            </button>
            {user?.groups?.includes('administradores') && (
              <button 
                className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Gestión Usuarios
              </button>
            )}
            <button 
              className="debug-btn"
              onClick={() => setShowStats(!showStats)}
            >
              📊
            </button>
            <button 
              className="debug-btn"
              onClick={handleClearCache}
            >
              🗑️
            </button>
          </nav>
          {showStats && (
            <div className="stats-panel">
              <div>Req: {stats.requests}</div>
              <div>KB: {(stats.bytesTransferred / 1024).toFixed(1)}</div>
              <div>RCU: {stats.rcu}</div>
              <div>WCU: {stats.wcu}</div>
              <button onClick={() => networkMonitor.reset()}>🔄</button>
            </div>
          )}
        </header>
        <main className="app-main">
          {activeTab === 'schedule' && <GuardSchedule />}
          {activeTab === 'teachers' && <TeacherGuards />}
          {activeTab === 'report' && <ReportAbsence />}
          {activeTab === 'users' && <UserManagement />}
        </main>
      </div>
    </div>
  )
}

export default App
