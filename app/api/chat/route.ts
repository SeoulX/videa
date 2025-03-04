import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"

// Initialize AWS clients with credentials
const dynamoDBClient = new DynamoDBClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export async function POST(request: NextRequest) {
  try {
    const { videoId, message } = await request.json()

    if (!videoId || !message) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Fetch the video metadata from DynamoDB
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
      return NextResponse.json({ error: "Video not found or processing incomplete" }, { status: 404 })
    }

    const videoData = {
      title: getItemResponse.Item.title.S,
      description: getItemResponse.Item.description.S,
      objects: getItemResponse.Item.objects.SS,
      faceCount: Number.parseInt(getItemResponse.Item.faceCount.N || "0"),
      transcript: getItemResponse.Item.transcript.S,
      summary: getItemResponse.Item.summary.S,
      keyMoments: JSON.parse(getItemResponse.Item.keyMoments.S || "[]"),
    }

    // Use the AI SDK to generate a response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Based on the following video information, answer this question: "${message}"
      
      Video Title: ${videoData.title}
      Video Description: ${videoData.description}
      Objects Detected: ${videoData.objects.join(", ")}
      Faces Detected: ${videoData.faceCount}
      Transcript: ${videoData.transcript}
      Summary: ${videoData.summary}
      Key Moments: ${JSON.stringify(videoData.keyMoments)}`,
      system:
        "You are an AI assistant that has analyzed a video and can answer questions about its content. Be concise and informative.",
    })

    return NextResponse.json({
      response: text,
    })
  } catch (error) {
    console.error("Error generating chat response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

