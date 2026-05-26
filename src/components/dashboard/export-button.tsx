"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useExport } from "@/lib/hooks/use-analytics"

const EXPORT_TYPES = [
  { value: "entries", label: "Entries" },
  { value: "budgets", label: "Budgets" },
  { value: "votes", label: "Votes" },
  { value: "investments", label: "Investments" },
] as const

export function ExportButton() {
  const [exporting, setExporting] = useState<string | null>(null)
  const exportMutation = useExport()

  async function handleExport(type: string, format: "csv" | "pdf") {
    const key = `${type}-${format}`
    setExporting(key)

    try {
      const blob = await exportMutation.mutateAsync({ type, format })
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {EXPORT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-1 px-1 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-xs"
                onClick={() => handleExport(type.value, "csv")}
                disabled={exporting === `${type.value}-csv`}
              >
                {exporting === `${type.value}-csv` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                {type.label} CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-xs"
                onClick={() => handleExport(type.value, "pdf")}
                disabled={exporting === `${type.value}-pdf`}
              >
                {exporting === `${type.value}-pdf` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {type.label} PDF
              </Button>
            </div>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
