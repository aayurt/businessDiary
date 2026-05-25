import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  let session
  let postCount = 0
  try {
    session = await auth()
    postCount = await db.mdFile.count()
  } catch (err) {
    console.error("Failed to load home page data:", err)
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Next.js Boilerplate</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Next.js 16 with NextAuth, Prisma, shadcn/ui, and Markdown editor
      </p>

      <div className="grid gap-4 text-sm">
        <div className="rounded-lg border p-4">
          <span className="font-medium">Auth: </span>
          {session?.user ? (
            <span>Signed in as {session.user.email}</span>
          ) : (
            <span>Not signed in</span>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <span className="font-medium">Database: </span>
          <span>{postCount} posts</span>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {session?.user ? (
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline">Sign up</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
