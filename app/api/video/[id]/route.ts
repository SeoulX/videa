import { type NextRequest, NextResponse } from "next/server"
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize AWS clients with credentials
const dynamoDBClient = new DynamoDBClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const s3Client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id

    // Get the video metadata from DynamoDB
    const getItemResponse = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          PK: { S: `VIDEO#${videoId}` },
          SK: { S: "METADATA" },
        },
      }),
    )

    if (!getItemResponse.Item) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Generate signed URLs for the video and thumbnail
    const s3Key = `videos/${videoId}.mp4` // Assuming all videos are MP4
    const thumbnailKey = `thumbnails/${videoId}.jpg` // Assuming thumbnails are JPG

    const videoCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    })

    const thumbnailCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: thumbnailKey,
    })

    const downloadCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${videoId}.mp4"`,
    })

    const [videoUrl, thumbnailUrl, downloadUrl] = await Promise.all([
      getSignedUrl(s3Client, videoCommand, { expiresIn: 3600 }),
      getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 3600 }).catch(() => "/placeholder.svg"),
      getSignedUrl(s3Client, downloadCommand, { expiresIn: 3600 }),
    ])

    // Format the video data
    const video = {
      id: videoId,
      title: getItemResponse.Item.title.S || "Untitled Video",
      description: getItemResponse.Item.description.S || "",
      url: videoUrl,
      thumbnail: thumbnailUrl,
      downloadUrl: downloadUrl,
      uploadedAt: getItemResponse.Item.createdAt.S || new Date().toISOString(),
      duration: Number.parseInt(getItemResponse.Item.duration?.N || "0"),
      type: videoId.startsWith("youtube-") ? "youtube" : "uploaded",
      insights: {
        objects: getItemResponse.Item.objects.SS || [],
        faces: Number.parseInt(getItemResponse.Item.faceCount.N || "0"),
        transcript: getItemResponse.Item.transcript.S || "",
        summary: getItemResponse.Item.summary.S || "",
        keyMoments: JSON.parse(getItemResponse.Item.keyMoments.S || "[]"),
      },
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}

