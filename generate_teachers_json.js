import fs from 'fs';

// Leer el archivo de profesores
const data = JSON.parse(fs.readFileSync('./src/data/plantilla_profesores_guardia.json', 'utf8'));

// Set para evitar duplicados
const teachersSet = new Set();
const teachers = [];

// Extraer todos los profesores únicos
Object.keys(data).forEach(day => {
  Object.keys(data[day]).forEach(hour => {
    data[day][hour].forEach(teacher => {
      const key = `${teacher.nombre}|${teacher.email}`;
      if (!teachersSet.has(key)) {
        teachersSet.add(key);
        teachers.push(teacher);
      }
    });
  });
});

// Convertir al formato requerido
const teachersJson = teachers.map((teacher, index) => {
  const teacherId = `T${String(index + 1).padStart(3, '0')}`;
  return {
    PK: `TEACHER#${teacherId}`,
    displayName: teacher.nombre,
    email: teacher.email,
    active: true
  };
});

// Guardar el resultado
fs.writeFileSync('./src/data/teachers.json', JSON.stringify(teachersJson, null, 2));
console.log(`Generados ${teachersJson.length} profesores en teachers.json`);
