const QUEUE_KEY = "OFFLINE_MUTATION_QUEUE"

interface QueuedMutation {
  id: string
  url: string
  method: string
  body?: unknown
  timestamp: number
}

export function getOfflineQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToOfflineQueue(mutation: Omit<QueuedMutation, "id" | "timestamp">) {
  const queue = getOfflineQueue()
  queue.push({ ...mutation, id: crypto.randomUUID(), timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function removeFromOfflineQueue(id: string) {
  const queue = getOfflineQueue().filter((m) => m.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export async function replayOfflineQueue(
  onProgress?: (current: number, total: number) => void,
  onDone?: (results: { id: string; success: boolean; error?: string }[]) => void,
) {
  const queue = getOfflineQueue()
  if (queue.length === 0) return

  const results: { id: string; success: boolean; error?: string }[] = []

  for (const mutation of queue) {
    if (!mutation) continue
    const idx = queue.indexOf(mutation)
    onProgress?.(idx + 1, queue.length)

    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      })
      if (res.ok) {
        results.push({ id: mutation.id, success: true })
        removeFromOfflineQueue(mutation.id)
      } else {
        results.push({ id: mutation.id, success: false, error: `HTTP ${res.status}` })
      }
    } catch (err) {
      results.push({ id: mutation.id, success: false, error: String(err) })
    }
  }

  onDone?.(results)
}

export function hasPendingMutations(): boolean {
  return getOfflineQueue().length > 0
}
