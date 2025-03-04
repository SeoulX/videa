import { type NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn"
import { createWriteStream } from "fs"
import { spawn } from "child_process"
import { unlink } from "fs/promises"
import { Readable } from "stream"

// Initialize AWS clients with credentials
const s3Client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const stepFunctionsClient = new SFNClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Helper function to download YouTube video using youtube-dl
async function downloadYouTubeVideo(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn("youtube-dl", ["--format=best[ext=mp4]", "--output", outputPath, url])

    process.stderr.on("data", (data) => {
      console.error(`youtube-dl stderr: ${data}`)
    })

    process.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`youtube-dl process exited with code ${code}`))
      }
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No YouTube URL provided" }, { status: 400 })
    }

    // Generate a unique ID for the video
    const videoId = `youtube-${Date.now()}`
    const outputPath = `/tmp/${videoId}.mp4`

    try {
      // Download the YouTube video
      await downloadYouTubeVideo(url, outputPath)

      // Upload the video to S3
      const fileBuffer = await Readable.from(createWriteStream(outputPath)).read()

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `videos/${videoId}.mp4`,
          Body: fileBuffer,
          ContentType: "video/mp4",
        }),
      )

      // Clean up the temporary file
      await unlink(outputPath)

      // Start the Step Functions workflow to process the video
      await stepFunctionsClient.send(
        new StartExecutionCommand({
          stateMachineArn: process.env.AWS_STEP_FUNCTION_ARN,
          input: JSON.stringify({
            videoId,
            s3Key: `videos/${videoId}.mp4`,
            title: `YouTube Import: ${url}`,
            description: `Imported from YouTube: ${url}`,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            isYouTube: true,
          }),
        }),
      )

      return NextResponse.json({
        success: true,
        videoId,
        message: "YouTube video import successful. Processing has begun.",
      })
    } catch (error) {
      console.error("Error downloading YouTube video:", error)
      return NextResponse.json({ error: "Failed to download YouTube video" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing YouTube video:", error)
    return NextResponse.json({ error: "Failed to process YouTube video" }, { status: 500 })
  }
}

