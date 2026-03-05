import { useState } from 'react'
import { authService } from '../services/authService'
import { api } from '../services/api'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface AbsenceForm {
  fecha: Date | null
  hora: string
  aula: string
  comentarios: string
}

export default function ReportAbsence() {
  const [form, setForm] = useState<AbsenceForm>({
    fecha: null,
    hora: '1',
    aula: '',
    comentarios: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const user = authService.getUser()
      if (!user?.teacherId) {
        throw new Error('No se pudo obtener el ID del profesor')
      }

      const absenceData = {
        teacherId: user.teacherId,
        fecha: form.fecha?.toLocaleDateString('en-CA'), // Formato YYYY-MM-DD sin zona horaria
        hora: form.hora,
        aula: form.aula,
        comentarios: form.comentarios
      }

      // Enviar a la API real
      const response = await api.post('/api/reportar-ausencia', absenceData)
      
      setMessage(`Ausencia reportada correctamente:
      📅 Fecha: ${form.fecha?.toLocaleDateString('es-ES')}
      🕐 Hora: ${form.hora}ª hora
      🏫 Aula: ${form.aula}
      👤 Profesor: ${user.teacherId}
      💬 Comentarios: ${form.comentarios || 'Sin comentarios'}`)
      
      setForm({ fecha: null, hora: '1', aula: '', comentarios: '' })
    } catch (error) {
      console.error('Error en simulación:', error)
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-absence">
      <h2>Reportar Ausencia</h2>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          <pre style={{ whiteSpace: 'pre-line', fontFamily: 'inherit', margin: 0 }}>{message}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="absence-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha">Fecha:</label>
            <DatePicker
              selected={form.fecha}
              onChange={(date) => setForm({ ...form, fecha: date })}
              filterDate={(date) => {
                const day = date.getDay()
                return day !== 0 && day !== 6 // Excluir domingos (0) y sábados (6)
              }}
              minDate={new Date()}
              maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecciona una fecha"
              className="date-picker-input"
              calendarStartDay={1}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hora">Hora de clase:</label>
            <select
              id="hora"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              required
            >
              <option value="1">1ª hora (8:30-9:20)</option>
              <option value="2">2ª hora (9:25-10:25)</option>
              <option value="3">3ª hora (10:30-11:20)</option>
              <option value="4">4ª hora (11:25-12:15)</option>
              <option value="5">5ª hora (12:40-13:30)</option>
              <option value="6">6ª hora (13:35-14:25)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="aula">Aula:</label>
          <input
            type="text"
            id="aula"
            value={form.aula}
            onChange={(e) => setForm({ ...form, aula: e.target.value })}
            placeholder="Ej: 101, Biblioteca, Laboratorio..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="comentarios">Comentarios:</label>
          <textarea
            id="comentarios"
            value={form.comentarios}
            onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
            placeholder="Motivo de la ausencia, instrucciones especiales..."
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Enviando...' : 'Reportar Ausencia'}
        </button>
      </form>
    </div>
  )
}
