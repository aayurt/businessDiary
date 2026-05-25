"use client"

import { useState } from "react"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface VoteButtonProps {
  fileId: string
  initialScore?: number
  userVote?: number | null
}

export function VoteButton({ fileId, initialScore = 0, userVote: initialUserVote = null }: VoteButtonProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: number) {
    if (loading) return
    setLoading(true)

    const previousVote = userVote
    const previousScore = score

    if (userVote === value) {
      setUserVote(null)
      setScore(score - value)
    } else {
      setUserVote(value)
      setScore(score + value - (userVote ?? 0))
    }

    try {
      const res = await fetch(`/api/files/${fileId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) throw new Error("Vote failed")
    } catch {
      setUserVote(previousVote)
      setScore(previousScore)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote(1)}
        aria-label="Upvote"
        data-active={userVote === 1 ? "true" : "false"}
        className={cn("h-8 w-8", userVote === 1 && "text-emerald-500 bg-emerald-500/10")}
        disabled={loading}
      >
        <ArrowBigUp className="h-5 w-5" />
      </Button>
      <span className="text-sm font-medium tabular-nums min-w-[1.5rem] text-center">
        {score}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote(-1)}
        aria-label="Downvote"
        data-active={userVote === -1 ? "true" : "false"}
        className={cn("h-8 w-8", userVote === -1 && "text-red-500 bg-red-500/10")}
        disabled={loading}
      >
        <ArrowBigDown className="h-5 w-5" />
      </Button>
    </div>
  )
}
