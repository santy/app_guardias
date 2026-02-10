const fs = require('fs');

// Leer archivos
const teachers = JSON.parse(fs.readFileSync('./src/data/teachers.json', 'utf8'));
const plantilla = JSON.parse(fs.readFileSync('./src/data/plantilla_profesores_guardia.json', 'utf8'));
const ausencias = JSON.parse(fs.readFileSync('./src/data/ausencias_profesores.json', 'utf8'));

// Crear mapeo de nombre a teacherId
const nameToId = {};
teachers.forEach(teacher => {
  nameToId[teacher.displayName] = teacher.PK.replace('TEACHER#', '');
});

// Transformar plantilla
const newPlantilla = {};
Object.keys(plantilla).forEach(day => {
  newPlantilla[day] = {};
  Object.keys(plantilla[day]).forEach(slot => {
    newPlantilla[day][slot] = plantilla[day][slot].map(prof => ({
      teacherId: nameToId[prof.nombre],
      objetivo: prof.guardias
    }));
  });
});

// Transformar ausencias
const newAusencias = ausencias.map(ausencia => ({
  ...ausencia,
  SK: nameToId[ausencia.SK.replace('TEACHER#', '')],
  profesorAsignado: nameToId[ausencia.profesorAsignado] || ausencia.profesorAsignado
}));

// Escribir archivos transformados
fs.writeFileSync('./src/data/plantilla_profesores_guardia.json', JSON.stringify(newPlantilla, null, 2));
fs.writeFileSync('./src/data/ausencias_profesores.json', JSON.stringify(newAusencias, null, 2));

console.log('Transformación completada');
