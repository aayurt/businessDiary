import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addToOfflineQueue } from "@/lib/offline-queue"
import type { Project } from "@/types/project"

export const PROJECTS_KEY = ["projects"]

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects")
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? "Failed to fetch projects")
  return json.data
}

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to create project")
      return json.data as Project
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = queryClient.getQueryData<Project[]>(PROJECTS_KEY)
      const optimistic: Project = { id: `temp-${Date.now()}`, name, files: [] }
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (old) =>
        old ? [optimistic, ...old] : [optimistic],
      )
      return { previous, optimistic }
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PROJECTS_KEY, context.previous)
      }
      addToOfflineQueue({ url: "/api/projects", method: "POST", body: { name: _name } })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useRenameProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, name }: { projectId: string; name: string }) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to rename project")
    },
    onMutate: async ({ projectId, name }) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = queryClient.getQueryData<Project[]>(PROJECTS_KEY)
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (old) =>
        old?.map((p) => (p.id === projectId ? { ...p, name } : p)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(PROJECTS_KEY, context.previous)
      addToOfflineQueue({ url: `/api/projects/${_vars.projectId}`, method: "PATCH", body: { name: _vars.name } })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = queryClient.getQueryData<Project[]>(PROJECTS_KEY)
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (old) =>
        old?.filter((p) => p.id !== projectId),
      )
      return { previous }
    },
    onError: (_err, _projectId, context) => {
      if (context?.previous) queryClient.setQueryData(PROJECTS_KEY, context.previous)
      addToOfflineQueue({ url: `/api/projects/${_projectId}`, method: "DELETE" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}
