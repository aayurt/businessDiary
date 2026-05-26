"use client"

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  tablePlugin,
  imagePlugin,
  codeBlockPlugin,
} from "@mdxeditor/editor"

interface MdxPreviewImplProps {
  source: string
}

export function MdxPreviewImpl({ source }: MdxPreviewImplProps) {
  return (
    <MDXEditor
      markdown={source}
      readOnly
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        linkPlugin(),
        quotePlugin(),
        tablePlugin(),
        imagePlugin(),
        codeBlockPlugin(),
      ]}
      contentEditableClassName="prose prose-slate dark:prose-invert max-w-none outline-none"
    />
  )
}
