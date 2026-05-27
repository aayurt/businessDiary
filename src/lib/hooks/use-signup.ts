"use client"

import { useMutation } from "@tanstack/react-query"

interface SignupInput {
  name: string
  email: string
  password: string
}

interface SignupResult {
  success: boolean
  error?: string
}

export function useSignup() {
  return useMutation({
    mutationFn: async (input: SignupInput): Promise<SignupResult> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error }
      return { success: true }
    },

  })
}
