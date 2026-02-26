export const handler = async () => ({
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify([
    { PK: "DOW#LUNES#SLOT#01", SK: "TEACHER#T001", objetivo: 4, activo: true },
    { PK: "DOW#LUNES#SLOT#01", SK: "TEACHER#T002", objetivo: 5, activo: true }
  ])
});