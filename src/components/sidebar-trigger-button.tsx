"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function SidebarTriggerButton() {
  return (
    <div className="fixed left-3 top-3 z-50">
      <SidebarTrigger />
    </div>
  )
}
