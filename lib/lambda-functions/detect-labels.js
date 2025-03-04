const {
  RekognitionClient,
  StartLabelDetectionCommand,
  GetLabelDetectionCommand,
} = require("@aws-sdk/client-rekognition")
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb")

const rekognitionClient = new RekognitionClient({ region: "ap-southeast-1" })
const dynamoDBClient = new DynamoDBClient({ region: "ap-southeast-1" })

exports.handler = async (event) => {
  try {
    const { videoId, s3Key, bucket } = event

    // Start label detection
    const startLabelDetectionResponse = await rekognitionClient.send(
      new StartLabelDetectionCommand({
        Video: {
          S3Object: {
            Bucket: bucket,
            Name: s3Key,
          },
        },
        MinConfidence: 70,
      }),
    )

    const jobId = startLabelDetectionResponse.JobId

    // Poll for job completion
    let jobComplete = false
    let labels = []

    while (!jobComplete) {
      const getLabelDetectionResponse = await rekognitionClient.send(
        new GetLabelDetectionCommand({
          JobId: jobId,
          SortBy: "TIMESTAMP",
        }),
      )

      jobComplete = getLabelDetectionResponse.JobStatus === "SUCCEEDED"

      if (jobComplete) {
        // Process the labels
        labels = getLabelDetectionResponse.Labels.map((label) => ({
          name: label.Label.Name,
          confidence: label.Label.Confidence,
          timestamp: label.Timestamp,
        }))
      } else {
        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    // Store the results in DynamoDB
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: { S: `VIDEO#${videoId}` },
          SK: { S: "LABELS" },
          labels: { S: JSON.stringify(labels) },
        },
      }),
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Label detection completed successfully",
        videoId,
        labelCount: labels.length,
      }),
    }
  } catch (error) {
    console.error("Error in label detection:", error)
    throw error
  }
}

