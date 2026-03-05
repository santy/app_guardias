import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'guardias-ausencias-profesores';

export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({})
        };
    }

    try {
        // Parse request body
        let body;
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch (parseError) {
            console.error('Error parsing body:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON in request body'
                })
            };
        }

        const { teacherId, fecha, hora, aula, comentarios } = body;

        // Validate required fields
        if (!teacherId || !fecha || !hora || !aula) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Faltan campos requeridos: teacherId, fecha, hora, aula'
                })
            };
        }

        // Generate week dates for GSI - CORREGIDO
        const dateObj = new Date(fecha + 'T00:00:00'); // Forzar zona horaria local
        const fechaCorregida = dateObj.toISOString().split('T')[0]; // Fecha corregida
        
        const weekStart = new Date(dateObj);
        const dayOfWeek = dateObj.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(dateObj.getDate() + daysToMonday);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        // Create DynamoDB item
        const item = {
            PK: `DATE#${fechaCorregida}#SLOT#${hora.padStart(2, '0')}`, // Usar fecha corregida
            SK: `TEACHER#${teacherId}`,
            GSI1PK: `WEEK#${weekStartStr}#${weekEndStr}`,
            GSI1SK: `DATE#${fechaCorregida}#SLOT#${hora.padStart(2, '0')}#TEACHER#${teacherId}`, // Usar fecha corregida
            aula: aula,
            comentarios: comentarios || '',
            asignada: false,
            profesorAsignadoId: null,
            ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 3 months TTL
        };

        // Put item in DynamoDB
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        });

        await docClient.send(command);

        console.log('Ausencia creada:', item);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Ausencia reportada correctamente',
                ausencia: {
                    fecha,
                    hora,
                    aula,
                    comentarios,
                    teacherId
                }
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message
            })
        };
    }
};
