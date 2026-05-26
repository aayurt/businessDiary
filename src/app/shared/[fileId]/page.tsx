import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SharedViewClient } from "./shared-view-client"

async function getFile(fileId: string, userId?: string) {
  const file = await db.mdFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      title: true,
      content: true,
      privacy: true,
      authorId: true,
      author: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!file) return null
  const isAuthor = userId ? file.authorId === userId : false

  if (file.privacy === "PRIVATE" && !isAuthor) return null

  if (file.privacy === "SHARED" && !isAuthor) {
    if (!userId) return null
    const hasAccess = await db.fileAccess.findFirst({
      where: { fileId, userId },
    })
    if (!hasAccess) return null
  }

  return {
    ...file,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  }
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ fileId: string }>
}) {
  const { fileId } = await params
  const session = await auth()
  const file = await getFile(fileId, session?.user?.id)

  if (!file) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="text-muted-foreground">
            This entry does not exist or you do not have access to view it.
          </p>
        </div>
      </div>
    )
  }

  return <SharedViewClient file={file} />
}
