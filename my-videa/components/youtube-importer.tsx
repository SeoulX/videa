"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function YoutubeImporter() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoInfo, setVideoInfo] = useState<any>(null)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    setVideoInfo(null)
  }

  const handleFetchInfo = async () => {
    if (!url) return

    // In a real app, we would fetch the video info from the YouTube API
    // For now, we'll simulate the fetch
    setProcessing(true)
    setProgress(30)

    setTimeout(() => {
      setVideoInfo({
        title: "Sample YouTube Video",
        thumbnail: "/placeholder.svg?height=720&width=1280",
        duration: "10:30",
        channel: "Sample Channel",
      })
      setProgress(60)
      setTimeout(() => {
        setProgress(100)
      }, 1000)
    }, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) return

    if (!videoInfo) {
      await handleFetchInfo()
    }

    setProcessing(true)

    // Simulate processing progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 300)

    // In a real app, we would download the YouTube video and start the processing pipeline
    // For now, we'll simulate the download and processing
    setTimeout(() => {
      clearInterval(interval)
      setProcessing(false)
      setProgress(100)

      // Redirect to the video page with a mock ID
      setTimeout(() => {
        router.push(`/video/youtube-${Date.now()}`)
      }, 1000)
    }, 6000)
  }

  const isValidYouTubeUrl = (url: string) => {
    // Simple validation for YouTube URLs
    return url.includes("youtube.com") || url.includes("youtu.be")
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <div className="flex gap-2">
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleUrlChange}
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchInfo}
              disabled={!isValidYouTubeUrl(url) || processing}
            >
              Fetch Info
            </Button>
          </div>
        </div>

        {videoInfo && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="aspect-video w-32 overflow-hidden rounded-md bg-muted">
                <img
                  src={videoInfo.thumbnail || "/placeholder.svg"}
                  alt={videoInfo.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">{videoInfo.title}</h3>
                <p className="text-xs text-muted-foreground">{videoInfo.channel}</p>
                <p className="text-xs text-muted-foreground">Duration: {videoInfo.duration}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Processing</Label>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!isValidYouTubeUrl(url) || processing}>
          {processing ? "Processing..." : "Import and Analyze"}
        </Button>
      </div>
    </form>
  )
}

