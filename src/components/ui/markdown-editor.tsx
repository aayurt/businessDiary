"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import "@mdxeditor/editor/style.css"

const MdxEditorImpl = dynamic(
  () => import("./mdx-editor-impl").then((mod) => mod.MdxEditorImpl),
  { ssr: false },
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number | string
}

export function MarkdownEditor({ value, onChange, height }: MarkdownEditorProps) {
  return useMemo(
    () => (
      <div
        className={`[&_.mdxeditor]:!min-h-0${height ? "" : " h-full"}`}
        style={height ? { minHeight: typeof height === "number" ? `${height}px` : height } : undefined}
      >
        <MdxEditorImpl value={value} onChange={onChange} />
      </div>
    ),
    [value, onChange, height],
  )
}
