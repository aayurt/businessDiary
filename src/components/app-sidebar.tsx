"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutDashboard, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold tracking-tight">Next.js App</h2>
        <p className="text-xs text-muted-foreground">Navigation</p>
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={isActive ? "true" : "false"}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 border-r bg-background">
          {nav}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0">
          {nav}
        </SheetContent>
      </Sheet>
    </>
  )
}
