"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MdxPreviewImplProps {
  source: string
}

export function MdxPreviewImpl({ source }: MdxPreviewImplProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  )
}
