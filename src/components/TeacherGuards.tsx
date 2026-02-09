import { useState, useEffect } from 'react'
import { profesoresService } from '../services/profesoresService'

interface Profesor {
  nombre: string
  guardias: number
}

interface ProfesoresData {
  [day: string]: {
    [hour: string]: Profesor[]
  }
  _lastUpdate?: string
}

const TeacherGuards = () => {
  const [profesoresData, setProfesoresData] = useState<ProfesoresData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES']
  const hours = ['1', '2', '3', '4', '5', '6']
  const hourLabels = ['8:30-9:20', '9:25-10:25', '10:30-11:20', '11:25-12:15', '12:40-13:30', '13:35-14:25']

  useEffect(() => {
    const loadProfesores = async () => {
      try {
        const data = await profesoresService.getProfesoresGuardia()
        const { _lastUpdate, ...profesoresData } = data
        setProfesoresData(profesoresData)
        setLastUpdate(_lastUpdate || '')
      } catch (err) {
        setError('Error al cargar los datos de profesores')
      } finally {
        setLoading(false)
      }
    }
    loadProfesores()
  }, [])

  const getTeachersForSlot = (day: string, hour: string) => {
    const dayData = profesoresData[day]
    if (!dayData || !dayData[hour]) {
      return []
    }
    return dayData[hour]
  }

  if (loading) return <div className="loading">Cargando profesores...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div className="week-navigation">
          <div className="week-info">
            <h2>Profesores de Guardia</h2>
            <p>Distribución semanal por horas</p>
          </div>
        </div>
      </div>
      
      <div className="schedule-grid">
        <div className="schedule-cell header">Hora</div>
        {days.map(day => (
          <div key={day} className="schedule-cell header">
            {day}
          </div>
        ))}
        
        {hours.map((hour, index) => (
          <>
            <div key={`time-${hour}`} className="schedule-cell time">
              {hourLabels[index]}
            </div>
            {days.map(day => {
              const teachers = getTeachersForSlot(day, hour)
              return (
                <div key={`${day}-${hour}`} className="schedule-cell teacher-slot">
                  {teachers.length > 0 ? (
                    <div className="teachers-in-slot">
                      {teachers.map((profesor: Profesor, idx: number) => (
                        <div key={idx} className="teacher-item">
                          <span className="name">{profesor.nombre}</span>
                          <span className="count">({profesor.guardias})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="no-assignment">-</span>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
      
      {lastUpdate && (
        <div className="debug-info">
          <small>Última actualización del servidor: {lastUpdate}</small>
        </div>
      )}
    </div>
  )
}

export default TeacherGuards
