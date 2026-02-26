export const handler = async () => ({
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify([
    {
      PK: "DATE#2026-02-03#SLOT#01",
      SK: "T001",
      GSI1PK: "WEEK#2026-02-02#2026-02-08",
      GSI1SK: "SLOT#01#TEACHER#T001",
      aula: "101",
      comentarios: "Guardia de biblioteca",
      asignada: true,
      profesorAsignado: "T002",
      ttl: 1770336000
    }
  ])
});