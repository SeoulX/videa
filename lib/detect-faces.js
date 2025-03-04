const { RekognitionClient, StartFaceDetectionCommand, GetFaceDetectionCommand } = require("@aws-sdk/client-rekognition")
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb")

const rekognitionClient = new RekognitionClient({ region: "us-east-1" })
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })

exports.handler = async (event) => {
  try {
    const { videoId, s3Key, bucket } = event

    // Start face detection
    const startFaceDetectionResponse = await rekognitionClient.send(
      new StartFaceDetectionCommand({
        Video: {
          S3Object: {
            Bucket: bucket,
            Name: s3Key,
          },
        },
        FaceAttributes: "ALL",
      }),
    )

    const jobId = startFaceDetectionResponse.JobId

    // Poll for job completion
    let jobComplete = false
    let faces = []

    while (!jobComplete) {
      const getFaceDetectionResponse = await rekognitionClient.send(
        new GetFaceDetectionCommand({
          JobId: jobId,
        }),
      )

      jobComplete = getFaceDetectionResponse.JobStatus === "SUCCEEDED"

      if (jobComplete) {
        // Process the faces
        faces = getFaceDetectionResponse.Faces.map((face) => ({
          timestamp: face.Timestamp,
          boundingBox: face.Face.BoundingBox,
          confidence: face.Face.Confidence,
          emotions: face.Face.Emotions,
          gender: face.Face.Gender,
          ageRange: face.Face.AgeRange,
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
          SK: { S: "FACES" },
          faces: { S: JSON.stringify(faces) },
          faceCount: { N: faces.length.toString() },
        },
      }),
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Face detection completed successfully",
        videoId,
        faceCount: faces.length,
      }),
    }
  } catch (error) {
    console.error("Error in face detection:", error)
    throw error
  }
}

