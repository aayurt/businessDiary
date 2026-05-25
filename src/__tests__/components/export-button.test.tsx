import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  Download: () => <span>DownloadIcon</span>,
  FileSpreadsheet: () => <span>SpreadsheetIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  Loader2: () => <span>LoaderIcon</span>,
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div>Separator</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="trigger">{children}</div>,
}))

describe('ExportButton', () => {
  it('renders export button', async () => {
    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    expect(screen.getByText('Export')).toBeTruthy()
  })

  it('renders export types in dropdown', async () => {
    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    expect(screen.getByText('Export Data')).toBeTruthy()
    expect(screen.getByText('Entries CSV')).toBeTruthy()
    expect(screen.getByText('Budgets CSV')).toBeTruthy()
    expect(screen.getByText('Votes CSV')).toBeTruthy()
    expect(screen.getByText('Investments CSV')).toBeTruthy()
  })

  it('renders PDF export options', async () => {
    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    expect(screen.getByText('Entries PDF')).toBeTruthy()
    expect(screen.getByText('Budgets PDF')).toBeTruthy()
    expect(screen.getByText('Votes PDF')).toBeTruthy()
    expect(screen.getByText('Investments PDF')).toBeTruthy()
  })

  it('shows loader when exporting CSV', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )
    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    const btn = screen.getByText('Entries CSV')
    fireEvent.click(btn)
    const loader = await screen.findByText('LoaderIcon')
    expect(loader).toBeTruthy()
  })

  it('shows loader when exporting PDF', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )
    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    const btn = screen.getByText('Entries PDF')
    fireEvent.click(btn)
    const loader = await screen.findByText('LoaderIcon')
    expect(loader).toBeTruthy()
  })

  it('handles export failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { ExportButton } = await import('@/components/dashboard/export-button')
    render(<ExportButton />)
    const btn = screen.getByText('Entries CSV')
    fireEvent.click(btn)

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })
})
