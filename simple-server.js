import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());

app.get('/api/profesores-guardia', (req, res) => {
  try {
    // Leer archivo DynamoDB
    const data = JSON.parse(fs.readFileSync('./src/data/plantilla_profesores_guardia_new.json', 'utf8'));
    const teachers = JSON.parse(fs.readFileSync('./src/data/teachers.json', 'utf8'));
    
    // Crear mapa de nombres
    const teacherNames = {};
    teachers.forEach(t => {
      const id = t.PK.replace('TEACHER#', '');
      teacherNames[id] = t.displayName;
    });
    
    // Transformar a formato esperado
    const result = {};
    data.forEach(record => {
      if (!record.activo) return;
      
      const [, day, , slot] = record.PK.split('#');
      const teacherId = record.SK.replace('TEACHER#', '');
      
      if (!result[day]) result[day] = {};
      if (!result[day][slot]) result[day][slot] = [];
      
      result[day][slot].push({
        nombre: teacherNames[teacherId] || `Profesor ${teacherId}`,
        guardias: record.objetivo
      });
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
