"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Sparkles, User } from "lucide-react"
import { useResearch } from "@/lib/hooks/use-research"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ResearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
  onApply: (text: string) => void
}

export function ResearchDialog({
  open,
  onOpenChange,
  title,
  content,
  onApply,
}: ResearchDialogProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initialised = React.useRef(false)
  const research = useResearch()

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 100)
  }

  const sendMessage = React.useCallback(
    async (userMessage: string) => {
      const userMsg: Message = { role: "user", content: userMessage }
      setMessages((prev) => [...prev, userMsg])
      setInput("")

      const updatedMessages = [...messages, userMsg]
      const result = await research.mutateAsync({
        title,
        content,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      setMessages((prev) => [...prev, { role: "assistant", content: result }])
    },
    [messages, research, title, content],
  )

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || research.isPending) return
    sendMessage(trimmed)
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  React.useEffect(() => {
    if (open && !initialised.current) {
      initialised.current = true
      setMessages([])
      sendMessage(
        `Research this business diary entry titled "${title}". Provide market context, key considerations, and actionable next steps.`,
      )
    }
    if (!open) {
      initialised.current = false
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastAssistantMessage = React.useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "",
    [messages],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Research Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {research.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask a follow-up question..."
            disabled={research.isPending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || research.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onApply(lastAssistantMessage)
              onOpenChange(false)
            }}
            disabled={!lastAssistantMessage}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Apply to entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
