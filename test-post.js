// Test directo del endpoint POST
const testPost = async () => {
  try {
    const response = await fetch('https://628ndxl031.execute-api.us-east-1.amazonaws.com/prod/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      },
      body: JSON.stringify({
        email: 'test@example.com',
        group: 'profesores'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Ejecutar en consola del navegador
testPost();
