"use client"

import * as React from "react"
import {
  Plus,
  Zap,
  Shield,
  Lightbulb,
  User,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Idea</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Zap className="mr-2 h-4 w-4" />
            <span>Trigger Agent Battle</span>
          </CommandItem>
          <CommandItem>
            <Lightbulb className="mr-2 h-4 w-4" />
            <span>Generate 20 Ideas</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Agents">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Summon Strategist</span>
          </CommandItem>
          <CommandItem>
            <Shield className="mr-2 h-4 w-4" />
            <span>Summon Risk Skeptic</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
