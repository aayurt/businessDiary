export type PrivacyMode = "PUBLIC" | "SHARED" | "PRIVATE"

export interface FileAccess {
  id: string
  fileId: string
  userId: string | null
  email: string
  user: { id: string; name: string | null; email: string } | null
  createdAt: string
}

export interface PublicPage {
  id: string
  fileId: string
  slug: string
  title: string
  content: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FileEntry {
  id: string
  title: string
  slug: string
  content: string
  confidenceScore?: number
  privacy: PrivacyMode
  authorId: string
  createdAt: string
  updatedAt: string
  publicPage: PublicPage | null
}
