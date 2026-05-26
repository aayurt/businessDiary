"use client"

import { useState } from "react"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useVote } from "@/lib/hooks/use-file"

interface VoteButtonProps {
  fileId: string
  initialScore?: number
  userVote?: number | null
}

export function VoteButton({ fileId, initialScore = 0, userVote: initialUserVote = null }: VoteButtonProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const vote = useVote()

  async function handleVote(value: number) {
    if (vote.isPending) return
    if (!navigator.onLine) return

    const previousVote = userVote
    const previousScore = score

    if (userVote === value) {
      setUserVote(null)
      setScore(score - value)
    } else {
      setUserVote(value)
      setScore(score + value - (userVote ?? 0))
    }

    vote.mutate(
      { fileId, value },
      {
        onError: () => {
          setUserVote(previousVote)
          setScore(previousScore)
        },
      },
    )
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
        disabled={vote.isPending}
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
        disabled={vote.isPending}
      >
        <ArrowBigDown className="h-5 w-5" />
      </Button>
    </div>
  )
}
