"use client"

import dynamic from "next/dynamic"

const MdxPreviewImpl = dynamic(
  () => import("./mdx-preview-impl").then((mod) => mod.MdxPreviewImpl),
  { ssr: false },
)

interface PreviewProps {
  source: string
}

export function Preview({ source }: PreviewProps) {
  return <MdxPreviewImpl source={source} />
}
