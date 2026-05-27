"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Preview } from "@/components/ui/preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ResearchDialog } from "@/components/ui/research-dialog"
import {
  Save,
  Eye,
  Edit3,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Bot,
  Globe,
  Lock,
  Users,
  Link2,
  Check,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useFile, useUpdateFile, usePublishFile } from "@/lib/hooks/use-file"
import { ShareDialog } from "@/components/ui/share-dialog"
import type { PrivacyMode, PublicPage } from "@/types/file"

function cacheKey(fileId: string) {
  return `file:${fileId}`
}

export default function EditorPage() {
  const { fileId: fileIdParam } = useParams()
  const fileId = fileIdParam as string
  const [content, setContent] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [confidence, setConfidence] = React.useState(0)
  const [researchOpen, setResearchOpen] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const [showSidebar, setShowSidebar] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"edit" | "preview">("edit")
  const [ready, setReady] = React.useState(false)
  const [privacy, setPrivacy] = React.useState<PrivacyMode>("PRIVATE")
  const [publicPage, setPublicPage] = React.useState<PublicPage | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  const lastSavedRef = React.useRef({ title: "", content: "", confidence: 0 })
  const fileIdRef = React.useRef(fileId)
  fileIdRef.current = fileId

  const { data: serverFile, isLoading } = useFile(fileId)
  const updateFile = useUpdateFile()

  const isDirty =
    title !== lastSavedRef.current.title ||
    content !== lastSavedRef.current.content ||
    confidence !== lastSavedRef.current.confidence

  const saveToCache = React.useCallback(
    (data: { title: string; content: string; confidence: number }) => {
      sessionStorage.setItem(cacheKey(fileId), JSON.stringify(data))
    },
    [fileId],
  )

  // On mount or fileId change: load from sessionStorage cache, then accept server data
  React.useEffect(() => {
    lastSavedRef.current = { title: "", content: "", confidence: 0 }
    setTitle("")
    setContent("")
    setConfidence(0)
    setLastSavedAt(null)
    setReady(false)

    const cached = sessionStorage.getItem(cacheKey(fileId))
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setContent(parsed.content ?? "")
        setTitle(parsed.title ?? "")
        setConfidence(parsed.confidence ?? 0)
        lastSavedRef.current = {
          title: parsed.title ?? "",
          content: parsed.content ?? "",
          confidence: parsed.confidence ?? 0,
        }
        setLastSavedAt(new Date())
        setReady(true)
      } catch {
        // invalid cache
      }
    }
  }, [fileId])

  // When server data arrives, apply it only if user hasn't started editing
  React.useEffect(() => {
    if (!serverFile) return
    if (ready) return

    setContent(serverFile.content)
    setTitle(serverFile.title)
    setConfidence(serverFile.confidenceScore ?? 0)
    setPrivacy(serverFile.privacy)
    setPublicPage(serverFile.publicPage ?? null)
    lastSavedRef.current = {
      title: serverFile.title,
      content: serverFile.content,
      confidence: serverFile.confidenceScore ?? 0,
    }
    setLastSavedAt(new Date())
    saveToCache({
      title: serverFile.title,
      content: serverFile.content,
      confidence: serverFile.confidenceScore ?? 0,
    })
    setReady(true)
  }, [serverFile, ready, saveToCache])

  // Autosave with 1.5s debounce
  const persistRef = React.useRef<(showToast?: boolean) => Promise<void>>(() => Promise.resolve())
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const doSave = React.useCallback(
    async (showToast = false) => {
      const id = fileIdRef.current
      if (!id) return;

      try {
        await updateFile.mutateAsync({
          fileId: id,
          title,
          content,
          confidenceScore: confidence,
          privacy,
        })
        lastSavedRef.current = { title, content, confidence }
        setLastSavedAt(new Date())
        saveToCache({ title, content, confidence })
        if (showToast) toast.success("Saved")
      } catch {
        if (showToast) toast.error("Failed to save")
      }
    },
    [title, content, confidence, privacy, saveToCache, updateFile],
  )

  persistRef.current = doSave

  React.useEffect(() => {
    if (!ready) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      persistRef.current()
    }, 1500)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [title, content, confidence, ready])

  // Cmd+S / Ctrl+S
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        persistRef.current?.(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSave = () => persistRef.current?.(true)

  const [publishCopied, setPublishCopied] = React.useState(false)
  const publishFile = usePublishFile()

  const handlePublish = async () => {
    try {
      const result = await publishFile.mutateAsync({ fileId })
      await navigator.clipboard.writeText(result.url)
      setPublishCopied(true)
      toast.success(
        publicPage
          ? "Page updated and link copied"
          : "Page published and link copied"
      )
      setTimeout(() => setPublishCopied(false), 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish")
    }
  }

  const handleApplyResearch = (text: string) => {
    setContent((prev) => prev + (prev ? "\n\n" : "") + text)
    toast.success("Research applied to entry")
  }

  // Key-based re-initialization for MDXEditor when fileId changes
  const editorKey = `${fileId}-${ready}`

  if (isLoading && !ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
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
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums">
            {updateFile.isPending ? (
              <span className="text-muted-foreground">Saving…</span>
            ) : isDirty ? (
              <span className="text-amber-500">Unsaved</span>
            ) : lastSavedAt ? (
              <span className="text-green-600">Saved</span>
            ) : null}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || updateFile.isPending}
          >
            {updateFile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setShareDialogOpen(true)}
          >
            {privacy === "PUBLIC" ? (
              <Globe className="h-3.5 w-3.5 text-green-500" />
            ) : privacy === "SHARED" ? (
              <Users className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs">
              {privacy === "PUBLIC" ? "Public" : privacy === "SHARED" ? "Shared" : "Private"}
            </span>
          </Button>
          {privacy === "PUBLIC" && (
            <Button
              variant={publicPage ? "outline" : "default"}
              size="sm"
              className="gap-1.5 h-8"
              onClick={handlePublish}
              disabled={publishFile.isPending}
            >
              {publishFile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : publishCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              <span className="text-xs">
                {publishFile.isPending ? "Publishing..." : publicPage ? "Republish" : "Publish"}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar((v) => !v)}
            className="h-8 w-8 max-lg:hidden"
          >
            {showSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        fileId={fileId}
        privacy={privacy}
        onPrivacyChange={(newPrivacy) => {
          setPrivacy(newPrivacy)
          updateFile.mutate(
            { fileId, privacy: newPrivacy },
            { onSuccess: () => toast.success("Privacy updated") },
          )
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop: full-screen split */}
          <div className="max-lg:hidden flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col">
              <MarkdownEditor
                key={editorKey}
                value={content}
                onChange={setContent}
              />
            </div>
            <div className="w-px bg-border shrink-0" />
            <div className="flex-1 min-w-0 overflow-y-auto p-8">
              <Preview source={content} />
            </div>
          </div>

          {/* Mobile/tablet: tabs */}
          <div className="lg:hidden flex-1 overflow-y-auto p-6 md:p-10">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
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
              <TabsContent value="edit">
                <div className="border rounded-md p-4 bg-background min-h-[600px]">
                  <MarkdownEditor
                    key={editorKey}
                    value={content}
                    onChange={setContent}
                    height={600}
                  />
                </div>
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-md p-8 bg-background min-h-[600px]">
                  <Preview source={content} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <aside
          className={`${
            showSidebar ? "w-80" : "w-0"
          } border-l bg-muted/30 flex-col overflow-hidden transition-all duration-300 max-lg:hidden lg:flex`}
        >
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
                AI Research
              </h3>
              <Button
                onClick={() => setResearchOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Bot className="mr-2 h-4 w-4" />
                Open Research Assistant
              </Button>
              <p className="text-xs text-muted-foreground italic">
                Get market insights and actionable research for this entry.
              </p>
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

      <ResearchDialog
        open={researchOpen}
        onOpenChange={setResearchOpen}
        title={title}
        content={content}
        onApply={handleApplyResearch}
      />
    </div>
  )
}
