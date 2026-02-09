# Requerimientos - Sistema de Guardias de Instituto

## Descripción General
Sistema web para gestionar las guardias de profesores en un instituto educativo. Permite visualizar el horario semanal de guardias y consultar información detallada de cada franja horaria.

## Funcionalidades Implementadas (Frontend)

### 1. Interfaz Principal
- **Horario Semanal**: Tabla interactiva que muestra los días de la semana (Lunes a Viernes) y las franjas horarias del instituto
- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Tema Visual**: Diseño moderno con gradientes y sombras

### 2. Visualización de Estados
- **Celdas con Guardias**: Color verde para horas con profesores asignados
- **Celdas que Necesitan Guardias**: Color rojo para horas con déficit de cobertura
- **Celdas Normales**: Color neutro para horas sin incidencias

### 3. Modal de Información
- **Click en Celda**: Al hacer clic en cualquier hora se abre un modal con información detallada
- **Profesores de Guardia**: Lista de profesores asignados a esa franja horaria
- **Profesores Ausentes**: Lista de profesores que faltan en esa hora
- **Alertas**: Indicadores visuales cuando se necesita cobertura adicional

### 4. Datos Ficticios
- Información de ejemplo para demostrar la funcionalidad
- Diferentes escenarios: horas cubiertas, horas con déficit, profesores ausentes

## Horario Implementado
- **Días**: Lunes a Viernes
- **Franjas Horarias**:
  - 8:30-9:20
  - 9:25-10:25
  - 10:30-11:20
  - 11:25-12:15
  - 12:40-13:30
  - 13:35-14:25

## Tecnologías Utilizadas
- **Frontend**: React 19.2.0 con TypeScript
- **Build Tool**: Vite 7.2.4
- **Estilos**: CSS3 con diseño moderno
- **Linting**: ESLint con configuración para React

## Funcionalidades Futuras (Backend)
- **API Gateway**: Para gestionar las peticiones HTTP
- **AWS Lambda**: Para la lógica de negocio
- **DynamoDB**: Para almacenamiento de datos
- **Autenticación**: Sistema de login para profesores/administradores
- **CRUD Completo**: Crear, editar y eliminar guardias
- **Notificaciones**: Alertas automáticas por ausencias
- **Reportes**: Estadísticas y reportes de guardias

## Estructura del Proyecto
```
src/
├── components/
│   ├── GuardSchedule.tsx    # Componente principal del horario
│   └── GuardModal.tsx       # Modal para mostrar detalles
├── App.tsx                  # Componente raíz
├── App.css                  # Estilos específicos de la app
├── index.css                # Estilos globales
└── main.tsx                 # Punto de entrada
```

## Instalación y Uso
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Notas de Desarrollo
- El sistema actualmente usa datos ficticios hardcodeados
- La interfaz está preparada para conectarse fácilmente con un backend
- El diseño es completamente responsivo
- Se ha priorizado la usabilidad y la claridad visual
