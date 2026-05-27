import { useMutation } from "@tanstack/react-query"

interface ResearchMessage {
  role: "user" | "assistant"
  content: string
}

interface ResearchInput {
  title: string
  content: string
  messages: ResearchMessage[]
}

export function useResearch() {
  return useMutation({
    mutationFn: async (input: ResearchInput): Promise<string> => {
      const res = await fetch("/api/research", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Research failed")
      return json.data as string
    },

  })
}
