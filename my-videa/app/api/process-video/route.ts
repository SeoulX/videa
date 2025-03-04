import { type NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { RekognitionClient } from "@aws-sdk/client-rekognition"
import { TranscribeClient } from "@aws-sdk/client-transcribe"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn"

// Initialize AWS clients
const s3Client = new S3Client({ region: "us-east-1" })
const rekognitionClient = new RekognitionClient({ region: "us-east-1" })
const transcribeClient = new TranscribeClient({ region: "us-east-1" })
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })
const stepFunctionsClient = new SFNClient({ region: "us-east-1" })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate a unique ID for the video
    const videoId = `video-${Date.now()}`
    const fileExtension = file.name.split(".").pop()
    const s3Key = `videos/${videoId}.${fileExtension}`

    // Upload the video to S3
    const fileBuffer = await file.arrayBuffer()
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
      }),
    )

    // Start the Step Functions workflow to process the video
    await stepFunctionsClient.send(
      new StartExecutionCommand({
        stateMachineArn: process.env.AWS_STEP_FUNCTION_ARN,
        input: JSON.stringify({
          videoId,
          s3Key,
          title,
          description,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        }),
      }),
    )

    return NextResponse.json({
      success: true,
      videoId,
      message: "Video upload successful. Processing has begun.",
    })
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}

