// Actualización necesaria para server.js para usar el formato DynamoDB optimizado

// En el endpoint /api/ausencias-profesores, cambiar:

// ANTES:
const ausenciasPath = path.join(__dirname, './src/data/ausencias_profesores.json');

// DESPUÉS:
const ausenciasPath = path.join(__dirname, './ausencias_profesores_ddb.json');

// Y actualizar el mapeo de datos:

// ANTES:
const transformedData = ausenciasData.map(ausencia => {
  console.log('Procesando ausencia:', ausencia.SK, 'Asignado a:', ausencia.profesorAsignado);
  return {
    ...ausencia,
    teacherName: teacherMap[ausencia.SK]?.nombre || `Profesor ${ausencia.SK}`,
    profesorAsignadoNombre: ausencia.profesorAsignado ? 
      (teacherMap[ausencia.profesorAsignado]?.nombre || `Profesor ${ausencia.profesorAsignado}`) : 
      null
  };
});

// DESPUÉS:
const transformedData = ausenciasData.map(ausencia => {
  // Extraer teacherId del SK: TEACHER#T001 -> T001
  const teacherId = ausencia.SK.replace('TEACHER#', '');
  
  // Extraer profesorAsignadoId si existe: TEACHER#T002 -> T002
  const profesorAsignadoId = ausencia.profesorAsignadoId ? 
    ausencia.profesorAsignadoId.replace('TEACHER#', '') : null;
  
  console.log('Procesando ausencia:', teacherId, 'Asignado a:', profesorAsignadoId);
  
  return {
    ...ausencia,
    // Mantener SK original para compatibilidad con el frontend
    SK: teacherId,
    // Mantener profesorAsignado para compatibilidad
    profesorAsignado: profesorAsignadoId,
    teacherName: teacherMap[teacherId]?.nombre || `Profesor ${teacherId}`,
    profesorAsignadoNombre: profesorAsignadoId ? 
      (teacherMap[profesorAsignadoId]?.nombre || `Profesor ${profesorAsignadoId}`) : 
      null
  };
});
