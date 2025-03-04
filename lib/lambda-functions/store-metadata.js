const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb")

const dynamoDBClient = new DynamoDBClient({ region: "ap-southeast-1" })

exports.handler = async (event) => {
  try {
    const { videoId, title, description } = event

    // Get all the processed data
    const [labelsResponse, facesResponse, transcriptResponse, insightsResponse] = await Promise.all([
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
      dynamoDBClient.send(
        new GetItemCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: {
            PK: { S: `VIDEO#${videoId}` },
            SK: { S: "INSIGHTS" },
          },
        }),
      ),
    ])

    const labels = JSON.parse(labelsResponse.Item.labels.S)
    const faceCount = Number.parseInt(facesResponse.Item.faceCount.N)
    const transcript = transcriptResponse.Item.transcript.S
    const summary = insightsResponse.Item.summary.S
    const keyMoments = JSON.parse(insightsResponse.Item.keyMoments.S)

    // Extract unique objects from labels
    const uniqueObjects = [...new Set(labels.map((label) => label.name))]

    // Store the consolidated metadata
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: { S: `VIDEO#${videoId}` },
          SK: { S: "METADATA" },
          title: { S: title },
          description: { S: description },
          objects: { SS: uniqueObjects },
          faceCount: { N: faceCount.toString() },
          transcript: { S: transcript },
          summary: { S: summary },
          keyMoments: { S: JSON.stringify(keyMoments) },
          createdAt: { S: new Date().toISOString() },
          status: { S: "COMPLETED" },
        },
      }),
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Video processing completed successfully",
        videoId,
      }),
    }
  } catch (error) {
    console.error("Error storing metadata:", error)
    throw error
  }
}

