import { useState, useEffect } from 'react'
import GuardModal from './GuardModal'
import { profesoresService } from '../services/profesoresService'

interface Profesor {
  nombre: string
  guardias: number
}

interface GuardSlot {
  day: string
  hour: string
  guards: Profesor[]
  absentTeachers: any[]
  needsGuard: boolean
}

interface ProfesoresData {
  [day: string]: {
    [hour: string]: Profesor[]
  }
  _lastUpdate?: string
}

interface AusenciasData {
  [weekDate: string]: {
    [day: string]: {
      [hour: string]: string[]
    }
  }
  _lastUpdate?: string
}

const GuardSchedule = () => {
  const [selectedSlot, setSelectedSlot] = useState<GuardSlot | null>(null)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [profesoresData, setProfesoresData] = useState<ProfesoresData>({})
  const [ausenciasData, setAusenciasData] = useState<AusenciasData>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [lastUpdateAusencias, setLastUpdateAusencias] = useState<string>('')

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const hours = ['8:30-9:20', '9:25-10:25', '10:30-11:20', '11:25-12:15', '12:40-13:30', '13:35-14:25']
  const dayKeys = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES']
  const hourKeys = ['1', '2', '3', '4', '5', '6']

  useEffect(() => {
    const loadProfesores = async () => {
      try {
        const profesores = await profesoresService.getProfesoresGuardia()
        const { _lastUpdate: profesoresUpdate, ...profesoresClean } = profesores
        setProfesoresData(profesoresClean)
        setLastUpdate(profesoresUpdate || '')
      } catch (err) {
        console.error('Error loading profesores:', err)
      }
    }
    loadProfesores()
  }, [])

  useEffect(() => {
    const loadAusencias = async () => {
      try {
        const weekKey = getWeekDateKey(currentWeekOffset)
        const ausencias = await profesoresService.getAusenciasProfesores(weekKey)
        const { _lastUpdate, ...ausenciasClean } = ausencias
        setAusenciasData(ausenciasClean)
        setLastUpdateAusencias(_lastUpdate || '')
      } catch (err) {
        console.error('Error loading ausencias:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAusencias()
  }, [currentWeekOffset])

  // Función para obtener las fechas de la semana
  const getWeekDates = (weekOffset: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // Ajustar para que lunes sea día 1
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7))
    
    const weekDates = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }

  const getWeekRange = (weekOffset: number) => {
    const dates = getWeekDates(weekOffset)
    const start = formatDate(dates[0])
    const end = formatDate(dates[4])
    return `${start} - ${end}`
  }

  const canGoBack = currentWeekOffset > -2
  const canGoForward = currentWeekOffset < 3

  const getWeekDateKey = (weekOffset: number) => {
    // Fechas corregidas: lunes 2 feb 2026, 9 feb 2026, 16 feb 2026
    const weekDates = ['2026-02-02', '2026-02-09', '2026-02-16']
    const index = weekOffset // 0 = semana actual, 1 = siguiente, 2 = tercera
    return weekDates[index] || '2026-02-02' // fallback a primera semana
  }

  const handleCellClick = (day: string, hour: string) => {
    const dayIndex = days.indexOf(day)
    const hourIndex = hours.indexOf(hour)
    
    if (dayIndex === -1 || hourIndex === -1) return
    
    const dayKey = dayKeys[dayIndex]
    const hourKey = hourKeys[hourIndex]
    const weekKey = getWeekDateKey(currentWeekOffset)
    
    const guards = profesoresData[dayKey]?.[hourKey] || []
    const absentTeachers = ausenciasData[weekKey]?.[dayKey]?.[hourKey] || []
    
    console.log('WeekKey:', weekKey, 'DayKey:', dayKey, 'HourKey:', hourKey)
    console.log('Ausencias para esta hora:', absentTeachers)
    
    const guardData: GuardSlot = {
      day,
      hour,
      guards,
      absentTeachers,
      needsGuard: guards.length === 0 || absentTeachers.length > 0
    }
    setSelectedSlot(guardData)
  }

  const getCellClass = (day: string, hour: string) => {
    const dayIndex = days.indexOf(day)
    const hourIndex = hours.indexOf(hour)
    
    if (dayIndex === -1 || hourIndex === -1) return 'schedule-cell clickable'
    
    const dayKey = dayKeys[dayIndex]
    const hourKey = hourKeys[hourIndex]
    const weekKey = getWeekDateKey(currentWeekOffset)
    
    const guards = profesoresData[dayKey]?.[hourKey] || []
    const absentTeachers = ausenciasData[weekKey]?.[dayKey]?.[hourKey] || []
    
    let classes = 'schedule-cell clickable'
    
    if (guards.length === 0 || absentTeachers.length > 0) {
      classes += ' needs-guard'
    } else {
      classes += ' has-guard'
    }
    
    return classes
  }

  if (loading) return <div className="loading">Cargando horario...</div>

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div className="week-navigation">
          <button 
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            disabled={!canGoBack}
            className="nav-button"
          >
            ← Anterior
          </button>
          <div className="week-info">
            <h2>Horario de Guardias</h2>
            <p>Semana del {getWeekRange(currentWeekOffset)}</p>
          </div>
          <button 
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            disabled={!canGoForward}
            className="nav-button"
          >
            Siguiente →
          </button>
        </div>
      </div>
      
      <div className="schedule-grid">
        {/* Header row */}
        <div className="schedule-cell header">Hora</div>
        {days.map((day, index) => {
          const weekDates = getWeekDates(currentWeekOffset)
          return (
            <div key={day} className="schedule-cell header">
              <div>{day}</div>
              <div className="date-small">{formatDate(weekDates[index])}</div>
            </div>
          )
        })}
        
        {/* Time slots */}
        {hours.map(hour => (
          <>
            <div key={`time-${hour}`} className="schedule-cell time">{hour}</div>
            {days.map(day => (
              <div
                key={`${day}-${hour}`}
                className={getCellClass(day, hour)}
                onClick={() => handleCellClick(day, hour)}
              >
                <span>Ver guardias</span>
              </div>
            ))}
          </>
        ))}
      </div>

      {selectedSlot && (
        <GuardModal
          guardSlot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}
      
      {lastUpdateAusencias && (
        <div className="debug-info">
          <small>Última actualización ausencias: {lastUpdateAusencias}</small>
        </div>
      )}
    </div>
  )
}

export default GuardSchedule
