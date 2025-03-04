const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb")
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda")

const dynamoDBClient = new DynamoDBClient({ region: "ap-southeast-1" })
const lambdaClient = new LambdaClient({ region: "ap-southeast-1" })

exports.handler = async (event) => {
  try {
    const { videoId, title, description } = event

    // Get the labels, faces, and transcript from DynamoDB
    const [labelsResponse, facesResponse, transcriptResponse] = await Promise.all([
      dynamoDBClient.send(
        new GetItemCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: {
            PK: { S: `VIDEO#${videoId}` },
            SK: { S: "LABELS" },
          },
        }),
      ),
      dynamoDBClient.send(
        new GetItemCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: {
            PK: { S: `VIDEO#${videoId}` },
            SK: { S: "FACES" },
          },
        }),
      ),
      dynamoDBClient.send(
        new GetItemCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: {
            PK: { S: `VIDEO#${videoId}` },
            SK: { S: "TRANSCRIPT" },
          },
        }),
      ),
    ])

    const labels = JSON.parse(labelsResponse.Item.labels.S)
    const faces = JSON.parse(facesResponse.Item.faces.S)
    const transcript = transcriptResponse.Item.transcript.S

    // Use a Lambda function with AI capabilities to generate insights
    // In a real implementation, this would use a service like Amazon Bedrock or OpenAI
    const aiResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.AI_LAMBDA_FUNCTION,
        Payload: JSON.stringify({
          videoId,
          title,
          description,
          labels,
          faces,
          transcript,
        }),
      }),
    )

    const aiResponsePayload = JSON.parse(Buffer.from(aiResponse.Payload).toString())
    const { summary, keyMoments } = aiResponsePayload

    // Store the insights in DynamoDB
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: { S: `VIDEO#${videoId}` },
          SK: { S: "INSIGHTS" },
          summary: { S: summary },
          keyMoments: { S: JSON.stringify(keyMoments) },
        },
      }),
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Insights generated successfully",
        videoId,
      }),
    }
  } catch (error) {
    console.error("Error generating insights:", error)
    throw error
  }
}

