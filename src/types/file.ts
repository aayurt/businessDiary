export interface FileEntry {
  id: string
  title: string
  slug: string
  content: string
  confidenceScore?: number
  published: boolean
  authorId: string
  createdAt: string
  updatedAt: string
}
