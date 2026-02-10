import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Endpoint para obtener los profesores de guardia
app.get('/api/profesores-guardia', (req, res) => {
  try {
    const plantillaPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
    const teachersPath = path.join(__dirname, './src/data/teachers.json');
    
    console.log('Cargando plantilla desde:', plantillaPath);
    console.log('Cargando profesores desde:', teachersPath);
    
    const plantillaData = JSON.parse(fs.readFileSync(plantillaPath, 'utf8'));
    const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
    
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
    
    // Transformar la plantilla para incluir nombres de profesores
    const transformedData = {};
    Object.keys(plantillaData).forEach(day => {
      transformedData[day] = {};
      Object.keys(plantillaData[day]).forEach(hour => {
        transformedData[day][hour] = plantillaData[day][hour].map(slot => ({
          nombre: teacherMap[slot.teacherId]?.nombre || `Profesor ${slot.teacherId}`,
          guardias: slot.objetivo,
          teacherId: slot.teacherId
        }));
      });
    });
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de profesores' });
  }
});

// Endpoint para obtener las ausencias de profesores
app.get('/api/ausencias-profesores', (req, res) => {
  try {
    const ausenciasPath = path.join(__dirname, './src/data/ausencias_profesores.json');
    const teachersPath = path.join(__dirname, './src/data/teachers.json');
    
    console.log('Cargando ausencias desde:', ausenciasPath);
    console.log('Cargando profesores desde:', teachersPath);
    
    const ausenciasData = JSON.parse(fs.readFileSync(ausenciasPath, 'utf8'));
    const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
    
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
    
    // Transformar las ausencias para incluir nombres de profesores
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
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de ausencias' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
