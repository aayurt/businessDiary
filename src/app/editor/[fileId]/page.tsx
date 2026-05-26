"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Preview } from "@/components/ui/preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Eye,
  Edit3,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

export default function EditorPage() {
  const { fileId } = useParams()
  const [content, setContent] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [confidence, setConfidence] = React.useState(0)
  const [research, setResearch] = React.useState("")
  const [isResearching, setIsResearching] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await fetch(`/api/files/${fileId}`)
        const json = await res.json()
        if (json.success) {
          setContent(json.data.content)
          setTitle(json.data.title)
          setConfidence(json.data.confidenceScore || 0)
        }
      } catch (error) {
        console.error("Failed to fetch file", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFile()
  }, [fileId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          content,
          confidenceScore: confidence
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        toast.success("Saved successfully")
      }
    } catch (error) {
      toast.error("Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResearch = async () => {
    setIsResearching(true)
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        body: JSON.stringify({ title, content }),
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (json.success) {
        setResearch(json.data)
        toast.success("Research completed")
      }
    } catch (error) {
      toast.error("Research failed")
    } finally {
      setIsResearching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-transparent text-lg font-semibold focus-visible:ring-0 px-0 h-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="mx-auto max-w-4xl space-y-6">
              <Tabs defaultValue="edit" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="edit" className="border rounded-md p-4 bg-muted/50 min-h-[600px]">
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    height={600}
                  />
                </TabsContent>
                <TabsContent value="preview" className="prose prose-slate dark:prose-invert max-w-none border rounded-md p-8 bg-background min-h-[600px]">
                  <Preview source={content} />
                </TabsContent>
              </Tabs>
            </div>
          </main>

          <aside className="w-80 border-l bg-muted/30 flex flex-col overflow-y-auto">
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Confidence Score
                  </h3>
                  <span className="text-sm font-bold text-primary">{confidence}%</span>
                </div>
                <Slider
                  value={[confidence]}
                  onValueChange={(vals) => setConfidence(vals[0] ?? 0)}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground italic">
                  How certain are you about this business idea?
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Gemini Research
                </h3>
                <Button
                  onClick={handleResearch}
                  disabled={isResearching}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isResearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Ask Gemini
                </Button>

                {research && (
                  <div className="mt-4 p-4 rounded-lg bg-background border text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                    {research}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  Community
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Votes</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold">0</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground h-auto py-1">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add a comment...
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </SidebarInset>
    </div>
  )
}
