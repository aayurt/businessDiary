import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search"
      />
    )
    expect(screen.getByText('Try adjusting your search')).toBeInTheDocument()
  })

  it('renders without description', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })

  it('renders default Inbox icon', () => {
    const { container } = render(<EmptyState title="No data" />)
    const iconContainer = container.querySelector('.rounded-full.bg-muted')
    expect(iconContainer).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    const { container } = render(
      <EmptyState title="No files" icon={FileText} />
    )
    const iconContainer = container.querySelector('.rounded-full.bg-muted')
    expect(iconContainer).toBeInTheDocument()
  })

  it('renders action element when provided', () => {
    render(
      <EmptyState
        title="No entries"
        action={<Button>Create entry</Button>}
      />
    )
    expect(screen.getByRole('button', { name: /create entry/i })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="Custom" className="my-custom-class" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('my-custom-class')
  })

  it('renders with title and description and action together', () => {
    render(
      <EmptyState
        title="Dashboard empty"
        description="Get started by creating your first entry"
        action={<Button>Get started</Button>}
      />
    )
    expect(screen.getByText('Dashboard empty')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first entry')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })
})
