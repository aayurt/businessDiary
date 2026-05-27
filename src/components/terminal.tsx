"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal as TerminalIcon, X, ChevronRight } from "lucide-react"

export function Terminal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [history, setHistory] = React.useState<string[]>(["Welcome to OpenCode Terminal v1.0.0", "Type 'help' for commands."])
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const cmd = input.trim().toLowerCase()
    let response = ""

    switch (cmd) {
      case 'help':
        response = "Available commands: help, battle, generate, research, clear"
        break
      case 'clear':
        setHistory([])
        setInput("")
        return
      case 'battle':
        response = "Triggering agent battle..."
        break
      case 'generate':
        response = "Generating new ideas..."
        break
      default:
        response = `Command not found: ${cmd}`
    }

    setHistory(prev => [...prev, `> ${input}`, response])
    setInput("")
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50 border border-zinc-700"
      >
        <TerminalIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[500px] h-[350px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col font-mono"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-400 font-bold tracking-tight">OPENCODE TERMINAL</span>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 text-zinc-500 hover:text-white" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto text-sm space-y-1">
              {history.map((line, i) => (
                <div key={i} className={line.startsWith('>') ? 'text-primary' : 'text-zinc-300'}>
                  {line}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} className="p-4 bg-zinc-900/50 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-sm text-zinc-100 placeholder:text-zinc-700"
                placeholder="Enter command..."
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
