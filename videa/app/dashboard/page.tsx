"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Upload, Youtube } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoUploader } from "@/components/video-uploader"
import { YoutubeImporter } from "@/components/youtube-importer"
import { VideoList } from "@/components/video-list"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("videos")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5" />
          <span>VideoInsight</span>
        </Link>
        <nav className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </nav>
      </header>
      <div className="grid flex-1 md:grid-cols-[240px_1fr]">
        <div className="hidden border-r md:block">
          <div className="flex h-full flex-col gap-2 p-4">
            <Button variant="outline" className="justify-start" onClick={() => setActiveTab("videos")}>
              <Home className="mr-2 h-4 w-4" />
              My Videos
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => setActiveTab("upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => setActiveTab("youtube")}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube Import
            </Button>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="md:hidden mb-4">
              <TabsTrigger value="videos">My Videos</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="m-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">My Videos</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("upload")}>
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("youtube")}>
                    Import from YouTube
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <VideoList />
              </div>
            </TabsContent>
            <TabsContent value="upload" className="m-0">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Upload Video</h2>
                <p className="text-muted-foreground mt-2">
                  Upload a video file to analyze with our AI and chat about its contents.
                </p>
                <div className="mt-6">
                  <VideoUploader />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="youtube" className="m-0">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Import from YouTube</h2>
                <p className="text-muted-foreground mt-2">
                  Provide a YouTube URL to analyze the video with our AI and chat about its contents.
                </p>
                <div className="mt-6">
                  <YoutubeImporter />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

