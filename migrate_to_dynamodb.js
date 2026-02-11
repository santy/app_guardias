import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo actual
const plantillaPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
const currentData = JSON.parse(fs.readFileSync(plantillaPath, 'utf8'));

// Transformar a estructura DynamoDB
const transformedData = [];

Object.keys(currentData).forEach(day => {
  Object.keys(currentData[day]).forEach(slot => {
    currentData[day][slot].forEach(teacher => {
      // Formatear slot con ceros a la izquierda para mantener orden
      const formattedSlot = slot.padStart(2, '0');
      
      const record = {
        PK: `DOW#${day}#SLOT#${formattedSlot}`,
        SK: `TEACHER#${teacher.teacherId}`,
        objetivo: teacher.objetivo,
        activo: true
      };
      
      transformedData.push(record);
    });
  });
});

// Guardar el archivo transformado
const outputPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_dynamodb.json');
fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

console.log(`✅ Transformación completada. ${transformedData.length} registros creados.`);
console.log(`📁 Archivo guardado en: ${outputPath}`);

// Mostrar algunos ejemplos
console.log('\n📋 Ejemplos de registros transformados:');
transformedData.slice(0, 5).forEach((record, index) => {
  console.log(`${index + 1}. ${JSON.stringify(record)}`);
});

console.log('\n🔄 Para aplicar los cambios:');
console.log('1. Revisa el archivo generado');
console.log('2. Reemplaza el archivo original si todo está correcto');
console.log('3. Actualiza el servidor y servicios');
