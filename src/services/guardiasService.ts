import { api } from './api'

export interface AsignacionGuardia {
  day: string
  hour: string
  profesorAusente: string
  profesorAsignado: string
}

class GuardiasService {
  async asignarGuardia(asignacion: AsignacionGuardia): Promise<void> {
    await api.post('/api/asignar-guardia', asignacion)
  }
}

export const guardiasService = new GuardiasService()
