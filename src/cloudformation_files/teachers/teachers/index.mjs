import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

export const handler = async (event) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'guardias-teachers'
    });

    const response = await dynamoClient.send(scanCommand);
    const teachers = response.Items?.map(item => unmarshall(item)) || [];

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
