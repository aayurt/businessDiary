"use client"

import { BookOpen, User } from "lucide-react"
import { Preview } from "@/components/ui/preview"
import { Separator } from "@/components/ui/separator"

interface SharedFile {
  id: string
  title: string
  content: string
  privacy: string
  authorId: string
  author: { name: string | null }
  createdAt: string
  updatedAt: string
}

export function SharedViewClient({ file }: { file: SharedFile }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center gap-3 border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Business Diary</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm text-muted-foreground">Shared view</span>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{file.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{file.author.name ?? "Unknown"}</span>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Preview source={file.content} />
        </div>
      </main>
    </div>
  )
}
