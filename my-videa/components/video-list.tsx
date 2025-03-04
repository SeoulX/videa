"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function VideoList() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // In a real app, we would fetch the videos from the API
    // For now, we'll use mock data
    const mockVideos = [
      {
        id: "video-1",
        title: "Company Meeting - Q1 2023",
        thumbnail: "/placeholder.svg?height=720&width=1280",
        uploadedAt: "2023-03-15T10:30:00Z",
        duration: 3600, // in seconds
        type: "uploaded",
      },
      {
        id: "video-2",
        title: "Product Demo - New Features",
        thumbnail: "/placeholder.svg?height=720&width=1280",
        uploadedAt: "2023-04-20T14:45:00Z",
        duration: 1200, // in seconds
        type: "uploaded",
      },
      {
        id: "youtube-1",
        title: "Marketing Strategy Webinar",
        thumbnail: "/placeholder.svg?height=720&width=1280",
        uploadedAt: "2023-05-10T09:15:00Z",
        duration: 2700, // in seconds
        type: "youtube",
      },
    ]

    setTimeout(() => {
      setVideos(mockVideos)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredVideos = videos.filter((video) => video.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search videos..." className="max-w-sm" disabled />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                <div className="mt-2 h-4 w-1/2 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Link key={video.id} href={`/video/${video.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-1">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                    <span className="ml-auto capitalize">{video.type}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

