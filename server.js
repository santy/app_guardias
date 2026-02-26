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

// Endpoint para obtener profesores (para localStorage)
app.get('/api/teachers', (req, res) => {
  try {
    const teachersPath = path.join(__dirname, './src/data/teachers.json');
    const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
    res.json(teachersData);
  } catch (error) {
    console.error('Error loading teachers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profesores-guardia', (req, res) => {
  try {
    const plantillaPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_new.json');
    const plantillaData = JSON.parse(fs.readFileSync(plantillaPath, 'utf8'));
    
    // Devolver datos RAW sin combinar con teachers
    res.json(plantillaData);
  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener las ausencias de profesores
app.get('/api/ausencias-profesores', (req, res) => {
  try {
    const ausenciasPath = path.join(__dirname, './ausencias_profesores_ddb.json');
    const ausenciasData = JSON.parse(fs.readFileSync(ausenciasPath, 'utf8'));
    
    // Devolver datos RAW sin combinar con teachers
    res.json(ausenciasData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de ausencias' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
