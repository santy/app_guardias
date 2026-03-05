import { getApiUrl } from '../config/api'
import { cacheService } from './cacheService'
import { teachersService } from './teachersService'
import { authService } from './authService'

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

const getWeekRange = (dateString: string): string => {
  const weekStart = getWeekStart(dateString)
  const startDate = new Date(weekStart)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  return `WEEK#${weekStart}#${endDate.toISOString().split('T')[0]}`
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
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [plantillaResponse, teachers] = await Promise.all([
        fetch(`${getApiUrl()}/api/profesores-guardia`, { headers }),
        teachersService.getTeachers()
      ]);
      
      if (!plantillaResponse.ok) {
        throw new Error('Error al obtener los datos');
      }
      
      const plantillaData = await plantillaResponse.json();
      const teacherMap = teachersService.createTeacherMap(teachers);
      
      // Transformar formato DynamoDB a formato frontend
      const transformedData: any = {};
      
      plantillaData.forEach((record: any) => {
        if (!record.activo) return;
        
        const pkParts = record.PK.split('#');
        const day = pkParts[1];
        const slot = pkParts[3].replace(/^0+/, '');
        const teacherId = record.SK.replace('TEACHER#', '');
        
        if (!transformedData[day]) transformedData[day] = {};
        if (!transformedData[day][slot]) transformedData[day][slot] = [];
        
        transformedData[day][slot].push({
          nombre: teacherMap[teacherId] || `Profesor ${teacherId}`,
          guardias: record.objetivo
        });
      });
      
      cacheService.set(CACHE_KEYS.PROFESORES_GUARDIA, transformedData);
      return { ...transformedData, _lastUpdate: new Date().toLocaleString('es-ES') };
    } catch (error) {
      console.error('Error fetching profesores:', error);
      throw error;
    }
  },

  async getAusenciasProfesores(weekDate?: string) {
    try {
      const currentWeekRange = getWeekRange(weekDate || new Date().toISOString().split('T')[0]);
      const encodedWeekRange = encodeURIComponent(currentWeekRange);
      
      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [ausenciasResponse, teachers] = await Promise.all([
        fetch(`${getApiUrl()}/api/ausencias-profesores?week=${encodedWeekRange}`, { headers }),
        teachersService.getTeachers()
      ]);
      
      if (!ausenciasResponse.ok) {
        throw new Error('Error al obtener las ausencias');
      }
      
      const rawData = await ausenciasResponse.json();
      const teacherMap = teachersService.createTeacherMap(teachers);
      
      // Agregar nombres de profesores a los datos
      const dataWithNames = rawData.map((ausencia: any) => {
        const teacherId = ausencia.SK.replace('TEACHER#', '');
        const profesorAsignadoId = ausencia.profesorAsignado ? 
          ausencia.profesorAsignado.replace('TEACHER#', '') : null;
        
        return {
          ...ausencia,
          teacherName: teacherMap[teacherId] || `Profesor ${teacherId}`,
          profesorAsignadoNombre: profesorAsignadoId ? 
            (teacherMap[profesorAsignadoId] || `Profesor ${profesorAsignadoId}`) : 
            null
        };
      });
      
      const transformedData = transformAusenciasData(dataWithNames);
      
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
