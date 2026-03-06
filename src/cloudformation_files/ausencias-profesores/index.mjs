import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

export const handler = async () => {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'guardias-ausencias-profesores'
    });

    const response = await dynamoClient.send(scanCommand);
    const items = response.Items?.map(item => unmarshall(item)) || [];

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify(items)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
