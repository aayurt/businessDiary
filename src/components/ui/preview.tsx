"use client"

import dynamic from "next/dynamic"
import "@uiw/react-markdown-preview/markdown.css"

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
)

interface PreviewProps {
  source: string
}

export function Preview({ source }: PreviewProps) {
  return (
    <div className="wmde-markdown-var">
      <MarkdownPreview source={source} />
    </div>
  )
}
