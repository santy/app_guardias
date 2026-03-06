export const handler = async () => ({
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify([
    { PK: "DOW#LUNES#SLOT#01", SK: "TEACHER#T001", objetivo: 4, activo: true },
    { PK: "DOW#LUNES#SLOT#01", SK: "TEACHER#T002", objetivo: 5, activo: true },
    { PK: "DOW#LUNES#SLOT#02", SK: "TEACHER#T003", objetivo: 3, activo: true },
    { PK: "DOW#MARTES#SLOT#01", SK: "TEACHER#T001", objetivo: 4, activo: true },
    { PK: "DOW#MARTES#SLOT#02", SK: "TEACHER#T004", objetivo: 2, activo: true },
    { PK: "DOW#MIÉRCOLES#SLOT#01", SK: "TEACHER#T002", objetivo: 5, activo: true }
  ])
});
