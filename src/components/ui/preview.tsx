"use client"

import dynamic from "next/dynamic"
import "@mdxeditor/editor/style.css"

const MdxPreviewImpl = dynamic(
  () => import("./mdx-preview-impl").then((mod) => mod.MdxPreviewImpl),
  { ssr: false },
)

interface PreviewProps {
  source: string
}

export function Preview({ source }: PreviewProps) {
  // key=source forces MDXEditor to re-mount when content changes
  // since MDXEditor ignores markdown prop updates after initial mount
  return <MdxPreviewImpl key={source} source={source} />
}
