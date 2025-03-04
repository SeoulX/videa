"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoPlayer } from "@/components/video-player"
import { VideoChat } from "@/components/video-chat"
import { VideoInsights } from "@/components/video-insights"

interface VideoPageProps {
  params: {
    id: string
  }
}

export default function VideoPage({ params }: VideoPageProps) {
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, we would fetch the video data from the API
    // For now, we'll use mock data
    const mockVideo = {
      id: params.id,
      title: "Sample Video Analysis",
      description: "This is a sample video for demonstration purposes.",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      uploadedAt: "2023-05-15T10:30:00Z",
      duration: 596, // in seconds
      insights: {
        objects: ["person", "car", "tree", "building"],
        faces: 3,
        transcript: "This is a sample transcript of the video content...",
        summary: "A short animated film about a rabbit dealing with bullies in the forest.",
        keyMoments: [
          { time: 45, description: "Rabbit appears" },
          { time: 120, description: "Confrontation with bullies" },
          { time: 300, description: "Revenge plan begins" },
        ],
      },
    }

    setTimeout(() => {
      setVideo(mockVideo)
      setLoading(false)
    }, 1000)
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{video.title}</h1>
          <p className="text-sm text-muted-foreground">{new Date(video.uploadedAt).toLocaleDateString()}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </header>
      <div className="grid flex-1 gap-6 p-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-0">
              <VideoPlayer videoUrl={video.url} />
            </CardContent>
          </Card>
          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="mt-4">
              <VideoChat videoId={video.id} />
            </TabsContent>
            <TabsContent value="insights" className="mt-4">
              <VideoInsights insights={video.insights} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Video Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-sm mt-1">{video.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                  <p className="text-sm mt-1">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Objects Detected</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {video.insights.objects.map((object: string) => (
                      <span
                        key={object}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {object}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Faces Detected</h4>
                  <p className="text-sm mt-1">{video.insights.faces}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Summary</h4>
                  <p className="text-sm mt-1">{video.insights.summary}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Key Moments</h4>
                  <ul className="text-sm mt-1 space-y-1">
                    {video.insights.keyMoments.map((moment: any) => (
                      <li key={moment.time} className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {Math.floor(moment.time / 60)}:{(moment.time % 60).toString().padStart(2, "0")}
                        </span>
                        <span>{moment.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

