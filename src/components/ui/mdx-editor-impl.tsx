"use client"

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  linkDialogPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  tablePlugin,
  imagePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  StrikeThroughSupSubToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertTable,
  InsertImage,
  InsertCodeBlock,
  InsertThematicBreak,
  Separator,
} from "@mdxeditor/editor"

interface MdxEditorImplProps {
  value: string
  onChange: (value: string) => void
}

export function MdxEditorImpl({ value, onChange }: MdxEditorImplProps) {
  return (
    <MDXEditor
      markdown={value}
      onChange={onChange}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <StrikeThroughSupSubToggles />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <ListsToggle />
              <Separator />
              <CreateLink />
              <InsertTable />
              <InsertImage />
              <InsertCodeBlock />
              <InsertThematicBreak />
            </>
          ),
        }),
        headingsPlugin(),
        listsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        quotePlugin(),
        tablePlugin(),
        imagePlugin({
          imageUploadHandler: async (image: File) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(image)
            })
          },
        }),
        codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
        codeMirrorPlugin({ codeBlockLanguages: { text: "Text", js: "JavaScript", ts: "TypeScript", jsx: "JSX", tsx: "TSX", json: "JSON", css: "CSS", html: "HTML", bash: "Bash", sql: "SQL", python: "Python", yaml: "YAML" } }),
        markdownShortcutPlugin(),
      ]}
      contentEditableClassName="prose prose-slate dark:prose-invert max-w-none min-h-[inherit] outline-none"
    />
  )
}
