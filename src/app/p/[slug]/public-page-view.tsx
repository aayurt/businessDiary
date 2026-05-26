"use client"

import { BookOpen, User, Calendar } from "lucide-react"
import { Preview } from "@/components/ui/preview"
import { Separator } from "@/components/ui/separator"

interface PublicPageViewProps {
  title: string
  content: string
  authorName: string | null
  publishedAt: string | null
}

export function PublicPageView({ title, content, authorName, publishedAt }: PublicPageViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center gap-3 border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Business Diary</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {authorName ?? "Unknown"}
            </span>
            {publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        <Separator className="mb-10" />

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Preview source={content} />
        </div>
      </main>
    </div>
  )
}
