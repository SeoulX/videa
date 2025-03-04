"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function VideoUploader() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) return

    setUploading(true)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 300)

    // In a real app, we would upload the file to S3 and start the processing pipeline
    // For now, we'll simulate the upload and processing
    setTimeout(() => {
      clearInterval(interval)
      setUploading(false)
      setProgress(100)

      // Redirect to the video page with a mock ID
      setTimeout(() => {
        router.push(`/video/mock-video-id-${Date.now()}`)
      }, 1000)
    }, 6000)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter video description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="video">Video File</Label>
          {!file ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drag and drop your video file</p>
                    <p className="text-xs text-muted-foreground">Supports MP4, MOV, AVI up to 500MB</p>
                  </div>
                  <Input id="video" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("video")?.click()}>
                    Select File
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <video className="h-10 w-10 rounded-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} disabled={uploading}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Uploading</Label>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={!file || uploading}>
          {uploading ? "Processing..." : "Upload and Analyze"}
        </Button>
      </div>
    </form>
  )
}

