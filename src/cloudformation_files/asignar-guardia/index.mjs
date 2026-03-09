import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'guardias-ausencias-profesores';

export const handler = async (event) => {
    console.log('Event completo:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log('Manejando OPTIONS request');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({})
        };
    }

    try {
        console.log('Body recibido:', event.body);
        
        let body;
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            console.log('Body parseado:', JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error('Error parsing body:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }

        const { day, hour, profesorAusente, profesorAsignado } = body;

        if (!day || !hour || !profesorAusente || !profesorAsignado) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Faltan campos requeridos: day, hour, profesorAusente, profesorAsignado'
                })
            };
        }

        console.log('Datos recibidos:', {
            day, // 2024-03-07
            hour, // "1"
            profesorAusente,
            profesorAsignado
        });

        // Calcular semana para GSI1PK
        const dateObj = new Date(day + 'T00:00:00');
        const weekStart = new Date(dateObj);
        const dayOfWeek = dateObj.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(dateObj.getDate() + daysToMonday);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        const fechaStr = dateObj.toISOString().split('T')[0];

        console.log('Fechas calculadas:', {
            fechaStr,
            weekStartStr,
            weekEndStr,
            hour: hour.padStart(2, '0')
        });

        // Buscar el registro específico
        const queryCommand = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :weekPK AND begins_with(GSI1SK, :datePK)',
            ExpressionAttributeValues: {
                ':weekPK': `WEEK#${weekStartStr}#${weekEndStr}`,
                ':datePK': `DATE#${fechaStr}#SLOT#${hour.padStart(2, '0')}`
            }
        });

        const queryResult = await docClient.send(queryCommand);
        
        // Encontrar el profesor ausente específico
        const targetRecord = queryResult.Items?.find(item => 
            item.SK === `TEACHER#${profesorAusente}`
        );

        if (!targetRecord) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'No se encontró la ausencia especificada'
                })
            };
        }

        if (targetRecord.asignada) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Esta guardia ya está asignada'
                })
            };
        }

        // Actualizar el registro
        const updateCommand = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: targetRecord.PK,
                SK: targetRecord.SK
            },
            UpdateExpression: 'SET asignada = :asignada, profesorAsignadoId = :profesorId',
            ExpressionAttributeValues: {
                ':asignada': true,
                ':profesorId': profesorAsignado
            }
        });

        await docClient.send(updateCommand);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Guardia asignada correctamente',
                asignacion: {
                    day: fechaStr,
                    hour: hour,
                    profesorAusente,
                    profesorAsignado
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
