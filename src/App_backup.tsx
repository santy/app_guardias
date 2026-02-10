import { useState } from 'react'
import './App.css'
import GuardSchedule from './components/GuardSchedule'
import TeacherGuards from './components/TeacherGuards'

function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'teachers'>('schedule')

  const handleClearCache = () => {
    if (confirm('¿Estás seguro de que quieres resetear toda la caché de la aplicación? Esto eliminará todos los datos guardados localmente.')) {
      localStorage.clear()
      alert('Caché reseteada correctamente. La página se recargará.')
      window.location.reload()
    }
  }

  return (
    <div className="app">
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
            className="debug-btn"
            onClick={handleClearCache}
            title="Resetear caché de la aplicación"
          >
            🗑️ Debug
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === 'schedule' && <GuardSchedule />}
        {activeTab === 'teachers' && <TeacherGuards />}
      </main>
    </div>
  )
}

export default App
