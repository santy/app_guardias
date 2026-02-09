# Instrucciones de Lanzamiento

## Requisitos Previos
- Node.js instalado
- npm instalado

## Instalación
```bash
npm install
```

## Ejecución

### Opción 1: Todo junto (Recomendado)
```bash
npm run dev:full
```

### Opción 2: Por separado

**Terminal 1 - Servidor API:**
```bash
npm run server
```

**Terminal 2 - Aplicación React:**
```bash
npm run dev
```

### Opción 3: Comandos directos
```bash
# Servidor
node server.js

# React (en otro terminal)
npm run dev
```

## URLs
- **Servidor API**: http://localhost:3001
- **Aplicación React**: http://localhost:5173
- **API Endpoint**: http://localhost:3001/api/profesores-guardia

## PowerShell (Windows)
```powershell
cd ".\app-guardias"
npm install
npm run dev:full
```

## Solución de Problemas
- Si falla `npm run server`, usar `node server.js`
- Verificar que ambos puertos (3001 y 5173) estén libres
- Comprobar que el archivo `src/data/plantilla_profesores_guardia.json` existe
