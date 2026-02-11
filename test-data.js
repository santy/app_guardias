const fs = require('fs');
const path = require('path');

console.log('Probando carga de archivos...');

try {
  const plantillaPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
  const teachersPath = path.join(__dirname, './src/data/teachers.json');
  
  console.log('Plantilla path:', plantillaPath);
  console.log('Teachers path:', teachersPath);
  
  const plantillaData = JSON.parse(fs.readFileSync(plantillaPath, 'utf8'));
  const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
  
  console.log('Plantilla records:', plantillaData.length);
  console.log('Teachers records:', teachersData.length);
  
  // Crear un mapa de teacherId -> teacher info
  const teacherMap = {};
  teachersData.forEach(teacher => {
    const teacherId = teacher.PK.replace('TEACHER#', '');
    teacherMap[teacherId] = {
      nombre: teacher.displayName,
      email: teacher.email,
      active: teacher.active
    };
  });
  
  console.log('Teacher map keys:', Object.keys(teacherMap).slice(0, 5));
  
  // Transformar la estructura DynamoDB a la estructura esperada por el frontend
  const transformedData = {};
  
  plantillaData.forEach(record => {
    // Solo procesar registros activos
    if (!record.activo) return;
    
    // Extraer información del PK: DOW#LUNES#SLOT#01
    const pkParts = record.PK.split('#');
    const day = pkParts[1];
    const slot = pkParts[3];
    
    // Extraer teacherId del SK: TEACHER#T001
    const teacherId = record.SK.replace('TEACHER#', '');
    
    // Inicializar estructuras si no existen
    if (!transformedData[day]) {
      transformedData[day] = {};
    }
    if (!transformedData[day][slot]) {
      transformedData[day][slot] = [];
    }
    
    // Agregar el profesor al slot
    transformedData[day][slot].push({
      nombre: teacherMap[teacherId]?.nombre || `Profesor ${teacherId}`,
      guardias: record.objetivo,
      teacherId: teacherId
    });
  });
  
  console.log('Transformed data keys:', Object.keys(transformedData));
  console.log('LUNES slots:', Object.keys(transformedData.LUNES || {}));
  console.log('LUNES slot 01:', transformedData.LUNES?.['01']?.length || 0, 'teachers');
  
} catch (error) {
  console.error('Error:', error);
}
