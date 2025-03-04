import { type NextRequest, NextResponse } from "next/server"
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
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

export async function GET(request: NextRequest) {
  try {
    // Query DynamoDB for all videos
    const queryResponse = await dynamoDBClient.send(
      new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE,
        KeyConditionExpression: "SK = :metadata",
        FilterExpression: "begins_with(PK, :video)",
        ExpressionAttributeValues: {
          ":metadata": { S: "METADATA" },
          ":video": { S: "VIDEO#" },
        },
        IndexName: "SK-PK-index", // You'll need to create this GSI on your DynamoDB table
      }),
    )

    if (!queryResponse.Items || queryResponse.Items.length === 0) {
      return NextResponse.json({ videos: [] })
    }

    // Process the videos and generate signed URLs for thumbnails
    const videos = await Promise.all(
      queryResponse.Items.map(async (item) => {
        const videoId = item.PK.S?.replace("VIDEO#", "") || ""
        const s3Key = `videos/${videoId}.mp4` // Assuming all videos are MP4
        const thumbnailKey = `thumbnails/${videoId}.jpg` // Assuming thumbnails are JPG

        // Generate a signed URL for the thumbnail
        const thumbnailCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: thumbnailKey,
        })

        let thumbnailUrl = "/placeholder.svg"
        try {
          thumbnailUrl = await getSignedUrl(s3Client, thumbnailCommand, { expiresIn: 3600 })
        } catch (error) {
          console.error(`Error generating thumbnail URL for ${videoId}:`, error)
        }

        return {
          id: videoId,
          title: item.title.S || "Untitled Video",
          description: item.description.S || "",
          thumbnail: thumbnailUrl,
          uploadedAt: item.createdAt.S || new Date().toISOString(),
          duration: Number.parseInt(item.duration?.N || "0"),
          type: videoId.startsWith("youtube-") ? "youtube" : "uploaded",
        }
      }),
    )

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}

