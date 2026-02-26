export const handler = async () => ({
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify([
    {
      PK: "DATE#2024-02-26#SLOT#01",
      SK: "TEACHER#T001",
      GSI1PK: "WEEK#2024-02-26#2024-03-03",
      GSI1SK: "SLOT#01#TEACHER#T001",
      aula: "101",
      comentarios: "Guardia de biblioteca",
      asignada: true,
      profesorAsignado: "TEACHER#T002",
      ttl: 1770336000
    },
    {
      PK: "DATE#2024-02-26#SLOT#02",
      SK: "TEACHER#T003",
      GSI1PK: "WEEK#2024-02-26#2024-03-03",
      GSI1SK: "SLOT#02#TEACHER#T003",
      aula: "205",
      comentarios: "Ausencia médica",
      asignada: false,
      profesorAsignado: null,
      ttl: 1770336000
    },
    {
      PK: "DATE#2024-02-27#SLOT#01",
      SK: "TEACHER#T002",
      GSI1PK: "WEEK#2024-02-26#2024-03-03",
      GSI1SK: "SLOT#01#TEACHER#T002",
      aula: "103",
      comentarios: "Formación",
      asignada: true,
      profesorAsignado: "TEACHER#T004",
      ttl: 1770336000
    }
  ])
});
