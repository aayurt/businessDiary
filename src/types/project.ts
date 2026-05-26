export interface Project {
  id: string
  name: string
  files: {
    id: string
    title: string
    slug: string
  }[]
}
