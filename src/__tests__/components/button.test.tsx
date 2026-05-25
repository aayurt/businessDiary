import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: /click me/i })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-primary')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole('button', { name: /delete/i })
    expect(btn.className).toContain('bg-destructive')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Cancel</Button>)
    const btn = screen.getByRole('button', { name: /cancel/i })
    expect(btn.className).toContain('border-input')
  })

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button', { name: /secondary/i })
    expect(btn.className).toContain('bg-secondary')
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button', { name: /ghost/i })
    expect(btn.className).toContain('hover:bg-accent')
  })

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>)
    const btn = screen.getByRole('button', { name: /link/i })
    expect(btn.className).toContain('underline-offset-4')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('h-9')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('h-11')

    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button').className).toContain('h-10 w-10')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link.className).toContain('bg-primary')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })
})
