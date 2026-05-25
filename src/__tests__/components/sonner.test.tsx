import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}))

vi.mock('sonner', () => ({
  Toaster: vi.fn(({ theme, className, icons, toastOptions, ...props }) => (
    <div
      data-testid="sonner-toaster"
      data-theme={theme}
      className={className}
      data-icons={Object.keys(icons).join(',')}
      {...props}
    />
  )),
}))

describe('Toaster', () => {
  it('renders Sonner Toaster with default props', async () => {
    const { Toaster } = await import('@/components/ui/sonner')
    const { container } = render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster).toBeInTheDocument()
  })

  it('passes theme from next-themes', async () => {
    const { Toaster } = await import('@/components/ui/sonner')
    render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster.getAttribute('data-theme')).toBe('light')
  })

  it('includes all icon types', async () => {
    const { Toaster } = await import('@/components/ui/sonner')
    render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    const icons = toaster.getAttribute('data-icons')
    expect(icons).toContain('success')
    expect(icons).toContain('info')
    expect(icons).toContain('warning')
    expect(icons).toContain('error')
    expect(icons).toContain('loading')
  })

  it('has toaster group class', async () => {
    const { Toaster } = await import('@/components/ui/sonner')
    render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster.className).toContain('toaster')
    expect(toaster.className).toContain('group')
  })

  it('passes additional props through to Sonner', async () => {
    const { Toaster } = await import('@/components/ui/sonner')
    render(<Toaster position="top-right" />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster.getAttribute('position')).toBe('top-right')
  })

  it('handles dark theme', async () => {
    const { useTheme } = await import('next-themes')
    vi.mocked(useTheme).mockReturnValue({ theme: 'dark', setTheme: vi.fn(), resolvedTheme: 'dark', themes: ['dark', 'light'], forcedTheme: undefined, systemTheme: undefined })
    const { Toaster } = await import('@/components/ui/sonner')
    const { rerender } = render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster.getAttribute('data-theme')).toBe('dark')
  })

  it('handles system theme', async () => {
    const { useTheme } = await import('next-themes')
    vi.mocked(useTheme).mockReturnValue({ theme: 'system', setTheme: vi.fn(), resolvedTheme: 'system', themes: ['dark', 'light', 'system'], forcedTheme: undefined, systemTheme: undefined })
    const { Toaster } = await import('@/components/ui/sonner')
    render(<Toaster />)
    const toaster = screen.getByTestId('sonner-toaster')
    expect(toaster.getAttribute('data-theme')).toBe('system')
  })
})
