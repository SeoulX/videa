"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface VideoChatProps {
  videoId: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function VideoChat({ videoId }: VideoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I've analyzed this video. Ask me anything about its content, people, objects, or events.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // In a real app, we would use the AI SDK to generate a response based on the video content
      // For now, we'll simulate the response

      // This is how you would use the AI SDK in a real implementation:
      // const { text } = await generateText({
      //   model: openai("gpt-4o"),
      //   prompt: `Based on the video with ID ${videoId}, answer the following question: ${input}`,
      //   system: "You are an AI assistant that has analyzed a video and can answer questions about its content."
      // })

      // Simulate AI response with a delay
      setTimeout(() => {
        const mockResponses: { [key: string]: string } = {
          "what is this video about?":
            "This video is an animated short film called 'Big Buck Bunny'. It follows a large rabbit who is harassed by a trio of rodents and then gets revenge on them.",
          "who appears in the video?":
            "The main character is a large rabbit named Big Buck Bunny. There are also three rodent antagonists: two squirrels and a flying squirrel.",
          "what happens in the video?":
            "The video shows Big Buck Bunny being peacefully in a meadow when he's harassed by three rodents. They drop a coconut on his head, throw a rock at a butterfly he's admiring, and use a slingshot to hurt him. Buck then sets traps for the rodents and gets his revenge.",
          "when was this created?":
            "Big Buck Bunny was released in 2008. It was produced by the Blender Foundation as part of the Peach open movie project.",
          "how long is the video?": "The full version of Big Buck Bunny is about 10 minutes long.",
        }

        let responseText =
          "I've analyzed the video and can tell you that it's an animated short film called 'Big Buck Bunny'. It features a large rabbit who encounters troublesome rodents in the forest."

        // Check if the input contains any keywords from our mock responses
        for (const [keyword, response] of Object.entries(mockResponses)) {
          if (input.toLowerCase().includes(keyword.replace(/\?/g, ""))) {
            responseText = response
            break
          }
        }

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error("Error generating response:", error)
      setIsLoading(false)

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar className={message.role === "assistant" ? "bg-primary" : "bg-muted"}>
                <AvatarFallback>{message.role === "assistant" ? "AI" : "You"}</AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="bg-primary">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask about the video content..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

