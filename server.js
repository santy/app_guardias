import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/profesores-guardia', (req, res) => {
  try {
    const plantillaPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_new.json');
    const teachersPath = path.join(__dirname, './src/data/teachers.json');
    
    const plantillaData = JSON.parse(fs.readFileSync(plantillaPath, 'utf8'));
    const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
    
    // Crear mapa de teachers
    const teacherMap = {};
    teachersData.forEach(teacher => {
      const teacherId = teacher.PK.replace('TEACHER#', '');
      teacherMap[teacherId] = teacher.displayName;
    });
    
    // Transformar formato DynamoDB a formato frontend
    const transformedData = {};
    
    plantillaData.forEach(record => {
      if (!record.activo) return;
      
      // Extraer día y slot del PK: DOW#LUNES#SLOT#01
      const pkParts = record.PK.split('#');
      const day = pkParts[1];
      const slot = pkParts[3].replace(/^0+/, ''); // Remover ceros iniciales
      
      // Extraer teacherId del SK: TEACHER#T001
      const teacherId = record.SK.replace('TEACHER#', '');
      
      if (!transformedData[day]) transformedData[day] = {};
      if (!transformedData[day][slot]) transformedData[day][slot] = [];
      
      transformedData[day][slot].push({
        nombre: teacherMap[teacherId] || `Profesor ${teacherId}`,
        guardias: record.objetivo
      });
    });
    
    console.log('Datos transformados:', JSON.stringify(transformedData, null, 2));
    res.json(transformedData);
  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener las ausencias de profesores
app.get('/api/ausencias-profesores', (req, res) => {
  try {
    // Usar el archivo optimizado para DynamoDB
    const ausenciasPath = path.join(__dirname, './ausencias_profesores_ddb.json');
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
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de ausencias' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
