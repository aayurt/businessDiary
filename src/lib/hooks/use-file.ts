import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addToOfflineQueue } from "@/lib/offline-queue"
import type { FileEntry, PrivacyMode, FileAccess } from "@/types/file"
import { PROJECTS_KEY } from "./use-projects"

export const ACCESS_KEY = (fileId: string) => ["file-access", fileId]

export function fileKey(fileId: string) {
  return ["file", fileId]
}

async function fetchFile(fileId: string): Promise<FileEntry> {
  const res = await fetch(`/api/files/${fileId}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? "Failed to fetch file")
  return json.data
}

export function useFile(fileId: string) {
  return useQuery({
    queryKey: fileKey(fileId),
    queryFn: () => fetchFile(fileId),
    staleTime: 30 * 1000,
    refetchOnMount: "always",
    enabled: !!fileId,
  })
}

export function useUpdateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
      ...data
    }: {
      fileId: string
      title?: string
      content?: string
      confidenceScore?: number
      privacy?: PrivacyMode
    }): Promise<FileEntry> => {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to update file")
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to update file")
      return json.data
    },
    onSuccess: (data, vars) => {
      queryClient.setQueryData(fileKey(vars.fileId), data)
    },
    onError: (_err, vars) => {
      addToOfflineQueue({
        url: `/api/files/${vars.fileId}`,
        method: "PATCH",
        body: { title: vars.title, content: vars.content, confidenceScore: vars.confidenceScore },
      })
    },
    onSettled: (_data, _err, vars) => {
      queryClient.setQueryData(fileKey(vars.fileId), _data)
      queryClient.invalidateQueries({ queryKey: fileKey(vars.fileId) })
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete file")
    },
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = queryClient.getQueryData(PROJECTS_KEY)
      queryClient.setQueryData(PROJECTS_KEY, (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((p: Record<string, unknown>) => ({
          ...p,
          files: ((p.files as Record<string, unknown>[]) ?? []).filter(
            (f: Record<string, unknown>) => f.id !== fileId,
          ),
        }))
      })
      return { previous }
    },
    onError: (_err, _fileId, context) => {
      if (context?.previous) queryClient.setQueryData(PROJECTS_KEY, context.previous)
      addToOfflineQueue({ url: `/api/files/${_fileId}`, method: "DELETE" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useCreateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
    }: {
      projectId: string
      title: string
    }): Promise<FileEntry> => {
      const res = await fetch(`/api/files/projects/${projectId}`, {
        method: "POST",
        body: JSON.stringify({ title }),
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to create file")
      return json.data
    },
    onMutate: async ({ projectId, title }) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = queryClient.getQueryData(PROJECTS_KEY)
      const tempId = `temp-${Date.now()}`
      const optimistic = { id: tempId, title, slug: "" }
      queryClient.setQueryData(PROJECTS_KEY, (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((p: Record<string, unknown>) =>
          p.id === projectId
            ? { ...p, files: [...((p.files as Record<string, unknown>[]) ?? []), optimistic] }
            : p,
        )
      })
      return { previous, tempId, projectId }
    },
    onError: (_err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(PROJECTS_KEY, context.previous)
      addToOfflineQueue({
        url: `/api/files/projects/${vars.projectId}`,
        method: "POST",
        body: { title: vars.title },
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

async function fetchAccess(fileId: string): Promise<FileAccess[]> {
  const res = await fetch(`/api/files/${fileId}/access`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? "Failed to fetch access")
  return json.data
}

export function useFileAccess(fileId: string) {
  return useQuery({
    queryKey: ACCESS_KEY(fileId),
    queryFn: () => fetchAccess(fileId),
    staleTime: 30 * 1000,
    enabled: !!fileId,
  })
}

export function useGrantAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId, email }: { fileId: string; email: string }): Promise<FileAccess> => {
      const res = await fetch(`/api/files/${fileId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to grant access")
      return json.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ACCESS_KEY(vars.fileId) })
      queryClient.invalidateQueries({ queryKey: fileKey(vars.fileId) })
    },
  })
}

export function useRevokeAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId, accessId }: { fileId: string; accessId: string }) => {
      const res = await fetch(`/api/files/${fileId}/access?id=${accessId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to revoke access")
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ACCESS_KEY(vars.fileId) })
      queryClient.invalidateQueries({ queryKey: fileKey(vars.fileId) })
    },
  })
}

export function usePublishFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
    }: {
      fileId: string
    }): Promise<{ slug: string; url: string }> => {
      const res = await fetch(`/api/files/${fileId}/publish`, { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to publish")
      return json.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: fileKey(vars.fileId) })
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fileId,
      value,
    }: {
      fileId: string
      value: number
    }): Promise<{ newScore: number }> => {
      const res = await fetch(`/api/files/${fileId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) throw new Error("Vote failed")
      return res.json()
    },
    onError: (_err, vars) => {
      addToOfflineQueue({
        url: `/api/files/${vars.fileId}/vote`,
        method: "POST",
        body: { value: vars.value },
      })
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: fileKey(vars.fileId) })
    },
  })
}
