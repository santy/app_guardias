export const handler = async (event) => {
  try {
    const teachers = [
      { PK: "TEACHER#T001", displayName: "Ana López", email: "ana.lopez@example.com", active: true },
      { PK: "TEACHER#T002", displayName: "Carlos Pérez", email: "carlos.perez@example.com", active: true },
      { PK: "TEACHER#T003", displayName: "María García", email: "maria.garcia@example.com", active: true },
      { PK: "TEACHER#T004", displayName: "Juan Martín", email: "juan.martin@example.com", active: true }
    ];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(teachers)
    };
  } catch (error) {
    console.error("Error en teachers:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
