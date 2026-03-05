import { getApiUrl } from '../config/api'
import { authService } from './authService'

interface Teacher {
  PK: string
  displayName: string
  email: string
  active: boolean
}

let teachersPromise: Promise<Teacher[]> | null = null;

export const teachersService = {
  async getTeachers(): Promise<Teacher[]> {
    const cached = localStorage.getItem('teachers');
    if (cached) {
      return JSON.parse(cached);
    }
    
    if (teachersPromise) {
      return teachersPromise;
    }
    
    teachersPromise = (async () => {
      try {
        // Temporalmente sin autenticación hasta resolver CORS
        const response = await fetch(`${getApiUrl()}/api/teachers`);
        
        if (!response.ok) {
          throw new Error('Error al obtener los profesores');
        }
        const data = await response.json();
        localStorage.setItem('teachers', JSON.stringify(data));
        teachersPromise = null;
        return data;
      } catch (error) {
        teachersPromise = null;
        console.error('Error fetching teachers:', error);
        throw error;
      }
    })();
    
    return teachersPromise;
  },

  createTeacherMap(teachers: Teacher[]) {
    const teacherMap: { [key: string]: string } = {};
    teachers.forEach(teacher => {
      // Verificar que teacher y teacher.PK existen
      if (teacher && teacher.PK) {
        const teacherId = teacher.PK.replace('TEACHER#', '');
        teacherMap[teacherId] = teacher.displayName;
      }
    });
    return teacherMap;
  }
};
