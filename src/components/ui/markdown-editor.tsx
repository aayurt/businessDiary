"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps): React.ReactElement {
  return useMemo(
    () => (
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val ?? "")}
          height={height}
        />
      </div>
    ),
    [value, onChange, height]
  )
}
