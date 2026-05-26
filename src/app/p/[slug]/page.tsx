import { db } from "@/lib/db"
import { PublicPageView } from "./public-page-view"

export default async function PublicPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const page = await db.publicPage.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
      file: {
        select: {
          author: { select: { name: true } },
        },
      },
    },
  })

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="text-muted-foreground">This page does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <PublicPageView
      title={page.title}
      content={page.content}
      authorName={page.file.author.name}
      publishedAt={page.publishedAt?.toISOString() ?? null}
    />
  )
}
