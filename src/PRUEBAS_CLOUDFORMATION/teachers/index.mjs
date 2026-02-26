export const handler = async (event) => {
  try {
    const guardSchedule = [
      { hour: "08:30", teacher: "Ana López" },
      { hour: "09:25", teacher: "Carlos Pérez" }
    ];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(guardSchedule)
    };
  } catch (error) {
    console.error("Error en profesores-guardia:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};