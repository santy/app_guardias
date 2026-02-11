import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Aplicando migración a DynamoDB...\n');

const originalPath = path.join(__dirname, './src/data/plantilla_profesores_guardia.json');
const newPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_new.json');
const backupPath = path.join(__dirname, './src/data/plantilla_profesores_guardia_backup.json');

try {
  // 1. Crear backup del archivo original
  console.log('📦 Creando backup del archivo original...');
  const originalData = fs.readFileSync(originalPath, 'utf8');
  fs.writeFileSync(backupPath, originalData);
  console.log(`   ✅ Backup creado: ${backupPath}`);

  // 2. Verificar que el nuevo archivo existe
  if (!fs.existsSync(newPath)) {
    throw new Error('El archivo con la nueva estructura no existe');
  }

  // 3. Reemplazar el archivo original
  console.log('🔄 Reemplazando archivo original...');
  const newData = fs.readFileSync(newPath, 'utf8');
  fs.writeFileSync(originalPath, newData);
  console.log(`   ✅ Archivo reemplazado: ${originalPath}`);

  // 4. Verificar que el reemplazo fue exitoso
  const verifyData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
  if (Array.isArray(verifyData) && verifyData.length > 0 && verifyData[0].PK && verifyData[0].SK) {
    console.log('   ✅ Verificación exitosa: Nueva estructura aplicada');
  } else {
    throw new Error('La verificación falló');
  }

  console.log('\n🎉 Migración completada exitosamente!');
  console.log('\n📋 Resumen:');
  console.log(`   • Archivo original respaldado en: ${path.basename(backupPath)}`);
  console.log(`   • Nueva estructura DynamoDB aplicada`);
  console.log(`   • ${verifyData.length} registros migrados`);
  
  console.log('\n🧪 Para probar la migración:');
  console.log('   1. Ejecuta el servidor: npm run dev');
  console.log('   2. Verifica que la aplicación funciona correctamente');
  console.log('   3. Si hay problemas, restaura desde el backup');

  console.log('\n🧹 Limpieza (opcional):');
  console.log(`   • Eliminar archivo temporal: rm ${path.basename(newPath)}`);
  console.log(`   • Eliminar scripts de migración cuando esté todo OK`);

} catch (error) {
  console.error('❌ Error durante la migración:', error.message);
  
  // Intentar restaurar desde backup si existe
  if (fs.existsSync(backupPath)) {
    console.log('🔄 Intentando restaurar desde backup...');
    try {
      const backupData = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(originalPath, backupData);
      console.log('✅ Restauración exitosa desde backup');
    } catch (restoreError) {
      console.error('❌ Error al restaurar desde backup:', restoreError.message);
    }
  }
  
  process.exit(1);
}
