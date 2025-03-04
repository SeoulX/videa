"use client"

import { useState } from "react"
import { Clock, List, MessageSquare, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VideoInsightsProps {
  insights: {
    objects: string[]
    faces: number
    transcript: string
    summary: string
    keyMoments: { time: number; description: string }[]
  }
}

export function VideoInsights({ insights }: VideoInsightsProps) {
  const [activeTab, setActiveTab] = useState("summary")

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Insights</CardTitle>
        <CardDescription>AI-generated analysis of the video content</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="objects">Objects</TabsTrigger>
            <TabsTrigger value="moments">Key Moments</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="space-y-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Summary</h3>
                <p className="text-sm mt-1">{insights.summary}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="transcript" className="space-y-4">
            <div className="flex items-start gap-2">
              <List className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Transcript</h3>
                <div className="mt-2 max-h-96 overflow-y-auto border rounded-md p-4 text-sm">{insights.transcript}</div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="objects" className="space-y-4">
            <div className="flex items-start gap-2">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Detected Objects</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {insights.objects.map((object) => (
                    <span
                      key={object}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {object}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Faces Detected</h4>
                  <p className="text-sm mt-1">{insights.faces}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="moments" className="space-y-4">
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Key Moments</h3>
                <div className="mt-2 space-y-2">
                  {insights.keyMoments.map((moment, index) => (
                    <div key={index} className="flex items-center gap-2 border rounded-md p-2">
                      <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                        {formatTime(moment.time)}
                      </div>
                      <p className="text-sm">{moment.description}</p>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        Jump to
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

