const {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe")
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb")

const transcribeClient = new TranscribeClient({ region: "ap-southeast-1" })
const s3Client = new S3Client({ region: "ap-southeast-1" })
const dynamoDBClient = new DynamoDBClient({ region: "ap-southeast-1" })

exports.handler = async (event) => {
  try {
    const { videoId, s3Key, bucket } = event

    // Start transcription job
    const jobName = `transcribe-${videoId}-${Date.now()}`
    const s3Uri = `s3://${bucket}/${s3Key}`

    await transcribeClient.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        Media: { MediaFileUri: s3Uri },
        MediaFormat: s3Key.split(".").pop(),
        LanguageCode: "en-US",
        OutputBucketName: bucket,
        OutputKey: `transcripts/${videoId}.json`,
      }),
    )

    // Poll for job completion
    let jobComplete = false
    let transcriptUri = ""

    while (!jobComplete) {
      const getTranscriptionJobResponse = await transcribeClient.send(
        new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        }),
      )

      const status = getTranscriptionJobResponse.TranscriptionJob.TranscriptionJobStatus

      if (status === "COMPLETED") {
        jobComplete = true
        transcriptUri = getTranscriptionJobResponse.TranscriptionJob.Transcript.TranscriptFileUri
      } else if (status === "FAILED") {
        throw new Error("Transcription job failed")
      } else {
        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    // Get the transcript from S3
    const transcriptKey = `transcripts/${videoId}.json`
    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: transcriptKey,
      }),
    )

    const transcriptData = await getObjectResponse.Body.transformToString()
    const transcriptJson = JSON.parse(transcriptData)
    const transcript = transcriptJson.results.transcripts[0].transcript

    // Store the transcript in DynamoDB
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          PK: { S: `VIDEO#${videoId}` },
          SK: { S: "TRANSCRIPT" },
          transcript: { S: transcript },
          transcriptUri: { S: transcriptUri },
        },
      }),
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Transcription completed successfully",
        videoId,
        transcriptLength: transcript.length,
      }),
    }
  } catch (error) {
    console.error("Error in transcription:", error)
    throw error
  }
}

