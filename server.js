import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint para obtener los profesores de guardia
app.get('/api/profesores-guardia', (req, res) => {
  try {
    const dataPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
    console.log('Buscando archivo en:', dataPath);
    const data = fs.readFileSync(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de profesores' });
  }
});

// Endpoint para obtener las ausencias de profesores
app.get('/api/ausencias-profesores', (req, res) => {
  try {
    const dataPath = path.join(__dirname, './src/data/ausencias_profesores.json');
    console.log('Buscando archivo en:', dataPath);
    const data = fs.readFileSync(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de ausencias' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
