"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { AgentRole } from "./types"

interface ProgressStep {
  role: AgentRole
  status: 'idle' | 'thinking' | 'debating' | 'completed'
  message: string
}

export function AgentProgressMonitor({ active }: { active: boolean }) {
  const [steps, setSteps] = React.useState<ProgressStep[]>([
    { role: 'STRATEGIST', status: 'idle', message: 'Strategist is waiting...' },
    { role: 'ARCHITECT', status: 'idle', message: 'Architect is waiting...' },
    { role: 'SKEPTIC', status: 'idle', message: 'Risk Skeptic is waiting...' },
    { role: 'VISIONARY', status: 'idle', message: 'Visionary is waiting...' },
    { role: 'OPERATOR', status: 'idle', message: 'Operator is waiting...' },
  ])

  React.useEffect(() => {
    if (!active) return

    const timer = setInterval(() => {
      setSteps(current => {
        const next = [...current];
        const idleIdx = next.findIndex(s => s.status === 'idle')
        if (idleIdx !== -1) {
          const item = next[idleIdx];
          if (item) {
             next[idleIdx] = { ...item, status: 'thinking', message: `${item.role} is analyzing idea...` };
          }
        } else {
          const thinkingIdx = next.findIndex(s => s.status === 'thinking')
          if (thinkingIdx !== -1) {
            const item = next[thinkingIdx];
            if (item) {
              next[thinkingIdx] = { ...item, status: 'debating', message: `${item.role} is entering the battle...` };
            }
          } else {
            const debatingIdx = next.findIndex(s => s.status === 'debating')
            if (debatingIdx !== -1) {
              const item = next[debatingIdx];
              if (item) {
                next[debatingIdx] = { ...item, status: 'completed', message: `${item.role} has finished.` };
              }
            }
          }
        }
        return next
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [active])

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <ActivityIcon className="h-4 w-4" />
        Agent Battle Monitor
      </h3>
      <div className="grid gap-3">
        {steps.map((step) => (
          <div key={step.role} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              {step.status === 'thinking' || step.status === 'debating' ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : step.status === 'completed' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-muted" />
              )}
              <span className="font-medium">{step.role}</span>
            </div>
            <span className="text-muted-foreground text-xs italic">{step.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
