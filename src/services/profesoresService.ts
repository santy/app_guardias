import { getApiUrl } from '../config/api'
import { cacheService } from './cacheService'

const CACHE_KEYS = {
  PROFESORES_GUARDIA: 'profesores_guardia'
}

interface AusenciaRecord {
  PK: string
  SK: string
  aula?: string
  comentarios?: string
  asignada: boolean
  profesorAsignado: string | null
  teacherName?: string
  profesorAsignadoNombre?: string | null
}

const getDayFromDate = (dateString: string): string => {
  const date = new Date(dateString)
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
  return days[date.getDay()]
}

const getWeekStart = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  return monday.toISOString().split('T')[0]
}

const transformAusenciasData = (ausenciasArray: AusenciaRecord[]) => {
  const result: any = {}
  
  ausenciasArray.forEach(record => {
    const pkParts = record.PK.split('#')
    const date = pkParts[1]
    const slot = pkParts[3].replace(/^0+/, '')
    const teacherName = record.teacherName || record.SK.replace('TEACHER#', '')
    const day = getDayFromDate(date)
    
    const weekStart = getWeekStart(date)
    
    if (!result[weekStart]) result[weekStart] = {}
    if (!result[weekStart][day]) result[weekStart][day] = {}
    if (!result[weekStart][day][slot]) result[weekStart][day][slot] = []
    
    result[weekStart][day][slot].push({
      nombre: teacherName,
      aula: record.aula,
      comentarios: record.comentarios,
      asignada: record.asignada,
      profesorAsignado: record.profesorAsignadoNombre || record.profesorAsignado
    })
  })
  
  return result
}

export const profesoresService = {
  async getProfesoresGuardia() {
    const cached = cacheService.get(CACHE_KEYS.PROFESORES_GUARDIA);
    if (cached) {
      return { ...cached.data, _lastUpdate: cached.lastUpdate };
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/profesores-guardia`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      const data = await response.json();
      cacheService.set(CACHE_KEYS.PROFESORES_GUARDIA, data);
      return { ...data, _lastUpdate: new Date().toLocaleString('es-ES') };
    } catch (error) {
      console.error('Error fetching profesores:', error);
      throw error;
    }
  },

  async getAusenciasProfesores(weekDate?: string) {
    try {
      const response = await fetch(`${getApiUrl()}/api/ausencias-profesores`);
      if (!response.ok) {
        throw new Error('Error al obtener las ausencias');
      }
      const rawData = await response.json();
      const transformedData = transformAusenciasData(rawData);
      
      if (weekDate) {
        const filteredData = { [weekDate]: transformedData[weekDate] || {} };
        return { ...filteredData, _lastUpdate: new Date().toLocaleString('es-ES') };
      }
      
      return { ...transformedData, _lastUpdate: new Date().toLocaleString('es-ES') };
    } catch (error) {
      console.error('Error fetching ausencias:', error);
      throw error;
    }
  }
};
