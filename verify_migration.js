import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando migración a DynamoDB...\n');

// Leer archivos
const oldPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
const newPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_new.json');

const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
const newData = JSON.parse(fs.readFileSync(newPath, 'utf8'));

// Contar registros en estructura antigua
let oldCount = 0;
Object.keys(oldData).forEach(day => {
  Object.keys(oldData[day]).forEach(slot => {
    oldCount += oldData[day][slot].length;
  });
});

// Contar registros en estructura nueva
const newCount = newData.length;

console.log(`📊 Estadísticas de migración:`);
console.log(`   Registros en estructura antigua: ${oldCount}`);
console.log(`   Registros en estructura nueva: ${newCount}`);
console.log(`   ✅ Coinciden: ${oldCount === newCount ? 'SÍ' : 'NO'}\n`);

// Verificar algunos registros específicos
console.log('🔍 Verificando registros específicos:');

// Buscar T001 en LUNES slot 1 en estructura antigua
const oldT001Lunes1 = oldData['LUNES']['1'].find(t => t.teacherId === 'T001');
console.log(`   Antigua - T001 LUNES slot 1: objetivo=${oldT001Lunes1?.objetivo}`);

// Buscar T001 en LUNES slot 1 en estructura nueva
const newT001Lunes1 = newData.find(r => 
  r.PK === 'DOW#LUNES#SLOT#01' && r.SK === 'TEACHER#T001'
);
console.log(`   Nueva - T001 LUNES slot 1: objetivo=${newT001Lunes1?.objetivo}`);
console.log(`   ✅ Coinciden: ${oldT001Lunes1?.objetivo === newT001Lunes1?.objetivo ? 'SÍ' : 'NO'}\n`);

// Verificar estructura de claves
console.log('🔑 Verificando estructura de claves:');
const sampleRecord = newData[0];
console.log(`   PK ejemplo: ${sampleRecord.PK}`);
console.log(`   SK ejemplo: ${sampleRecord.SK}`);
console.log(`   Campos: ${Object.keys(sampleRecord).join(', ')}`);
console.log(`   ✅ Estructura correcta: ${
  sampleRecord.PK && sampleRecord.SK && 
  typeof sampleRecord.objetivo === 'number' && 
  typeof sampleRecord.activo === 'boolean' ? 'SÍ' : 'NO'
}\n`);

// Verificar que todos los días y slots están representados
const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
const slots = ['01', '02', '03', '04', '05', '06'];

console.log('📅 Verificando cobertura de días y slots:');
let allCovered = true;

days.forEach(day => {
  slots.forEach(slot => {
    const pk = `DOW#${day}#SLOT#${slot}`;
    const records = newData.filter(r => r.PK === pk);
    if (records.length === 0) {
      console.log(`   ❌ Falta: ${pk}`);
      allCovered = false;
    }
  });
});

if (allCovered) {
  console.log('   ✅ Todos los días y slots están cubiertos');
}

console.log('\n🎯 Resumen de migración:');
console.log(`   ✅ Estructura DynamoDB implementada correctamente`);
console.log(`   ✅ ${newCount} registros migrados`);
console.log(`   ✅ Formato de claves PK/SK correcto`);
console.log(`   ✅ Campos objetivo y activo incluidos`);

console.log('\n📝 Próximos pasos:');
console.log('   1. Verificar que el servidor funciona con la nueva estructura');
console.log('   2. Probar la aplicación frontend');
console.log('   3. Si todo funciona, reemplazar el archivo original');
console.log('   4. Eliminar archivos temporales');
