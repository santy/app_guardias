interface Profesor {
  nombre: string
  guardias: number
}

interface AusenteProfessor {
  nombre: string
  aula?: string
  comentarios?: string
  asignada: boolean
  profesorAsignado: string | null
}

interface GuardSlot {
  day: string
  hour: string
  guards: Profesor[]
  absentTeachers: AusenteProfessor[]
  needsGuard: boolean
}

interface GuardModalProps {
  guardSlot: GuardSlot
  onClose: () => void
}

const GuardModal = ({ guardSlot, onClose }: GuardModalProps) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{guardSlot.day} - {guardSlot.hour}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="guard-info">
          <div className="guard-columns">
            <div className="guard-column">
              <h4>
                <span className="status-indicator status-available"></span>
                Profesores de Guardia ({guardSlot.guards.length})
              </h4>
              {guardSlot.guards.length > 0 ? (
                <ul className="guard-list">
                  {guardSlot.guards.map((guard, index) => (
                    <li key={index}>
                      {guard.nombre} <span style={{color: '#666', fontSize: '0.9em'}}>({guard.guardias} guardias)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#e53e3e', fontStyle: 'italic' }}>
                  No hay profesores asignados a esta guardia
                </p>
              )}
            </div>

            <div className="guard-column">
              <h4>
                <span className="status-indicator status-absent"></span>
                Profesores Ausentes ({guardSlot.absentTeachers.length})
              </h4>
              {guardSlot.absentTeachers.length > 0 ? (
                <ul className="guard-list absent-list">
                  {guardSlot.absentTeachers.map((teacher, index) => (
                    <li key={index} style={{ 
                      color: teacher.asignada ? '#38a169' : '#e53e3e'
                    }}>
                      {teacher.nombre}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#38a169', fontStyle: 'italic' }}>
                  No hay profesores ausentes en esta hora
                </p>
              )}
            </div>

            <div className="guard-column">
              <h4>
                <span className="status-indicator status-assigned"></span>
                Profesores Asignados ({guardSlot.absentTeachers.filter(t => t.asignada).length})
              </h4>
              {guardSlot.absentTeachers.filter(t => t.asignada && t.profesorAsignado).length > 0 ? (
                <ul className="guard-list assigned-list">
                  {guardSlot.absentTeachers
                    .filter(t => t.asignada && t.profesorAsignado)
                    .map((teacher, index) => (
                    <li key={index} style={{ color: '#38a169' }}>
                      <strong>{teacher.profesorAsignado}</strong>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        → cubre a {teacher.nombre}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No hay asignaciones para esta hora
                </p>
              )}
            </div>
          </div>
        </div>

        {guardSlot.needsGuard && (
          <div style={{ 
            background: '#fed7d7', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginTop: '1rem',
            border: '1px solid #e53e3e'
          }}>
            <strong style={{ color: '#e53e3e' }}>⚠️ Atención:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#2d3748' }}>
              {guardSlot.absentTeachers.length > 0 && guardSlot.absentTeachers.map((teacher, index) => (
                <div key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{typeof teacher === 'string' ? teacher : teacher.nombre}</strong>
                  {typeof teacher === 'object' && teacher.aula && ` - Aula: ${teacher.aula}`}
                  {typeof teacher === 'object' && teacher.comentarios && ` - ${teacher.comentarios}`}
                </div>
              ))}
            </p>
          </div>
        )}

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#f7fafc', 
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#4a5568'
        }}>
          <strong>Información de guardias:</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            Hora: {guardSlot.hour} | Día: {guardSlot.day}
            {guardSlot.absentTeachers.length > 0 && (
              <span> | Profesores ausentes con detalles de aula y comentarios</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default GuardModal
