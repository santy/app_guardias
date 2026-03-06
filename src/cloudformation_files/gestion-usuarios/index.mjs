import { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand, AdminDeleteUserCommand, AdminCreateUserCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_8k2Yf4afa';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: ''
            };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { email, group, displayName } = body;

            if (!email || !group) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Email y grupo son requeridos' })
                };
            }

            // Crear usuario en Cognito
            const createCommand = new AdminCreateUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' }
                ],
                MessageAction: 'SUPPRESS'
            });

            const createResult = await client.send(createCommand);
            const userUuid = createResult.User.Attributes.find(attr => attr.Name === 'sub')?.Value;

            // Añadir a grupo en Cognito
            const addToGroupCommand = new AdminAddUserToGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                GroupName: group
            });

            await client.send(addToGroupCommand);

            // Añadir a DynamoDB teachers table
            const putItemCommand = new PutItemCommand({
                TableName: 'guardias-teachers',
                Item: {
                    PK: { S: userUuid },
                    displayName: { S: displayName || email.split('@')[0] },
                    email: { S: email },
                    active: { BOOL: true },
                    createdAt: { S: new Date().toISOString() }
                }
            });

            await dynamoClient.send(putItemCommand);

            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    message: 'Usuario creado correctamente',
                    username: createResult.User.Username,
                    uuid: userUuid
                })
            };
        }

        if (event.httpMethod === 'DELETE') {
            const username = event.pathParameters?.username;
            if (!username) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Username requerido' })
                };
            }

            const deleteCommand = new AdminDeleteUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: username
            });

            await client.send(deleteCommand);

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Usuario eliminado correctamente' })
            };
        }

        // GET - Listar usuarios
        const listUsersCommand = new ListUsersCommand({
            UserPoolId: USER_POOL_ID
        });
        
        const usersResponse = await client.send(listUsersCommand);
        
        const usersWithGroups = await Promise.all(
            usersResponse.Users.map(async (user) => {
                const listGroupsCommand = new AdminListGroupsForUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: user.Username
                });
                
                const groupsResponse = await client.send(listGroupsCommand);
                
                return {
                    uuid: user.Attributes.find(attr => attr.Name === 'sub')?.Value,
                    username: user.Username,
                    email: user.Attributes.find(attr => attr.Name === 'email')?.Value,
                    status: user.UserStatus,
                    groups: groupsResponse.Groups.map(group => group.GroupName)
                };
            })
        );
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                users: usersWithGroups,
                total: usersWithGroups.length
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message })
        };
    }
};
