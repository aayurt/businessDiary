import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog', () => {
  it('renders trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument()
  })

  it('renders dialog content when open', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modal Title</DialogTitle>
            <DialogDescription>Modal description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
    expect(screen.getByText('Modal description')).toBeInTheDocument()
  })

  it('renders custom content inside dialog', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Custom Content</DialogTitle>
          <div data-testid="custom-content">Custom body content</div>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByTestId('custom-content')).toHaveTextContent('Custom body content')
  })

  it('renders header, title, description, footer', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dialog</DialogTitle>
            <DialogDescription>Full description</DialogDescription>
          </DialogHeader>
          <div>Body</div>
          <DialogFooter>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Complete Dialog')).toBeInTheDocument()
    expect(screen.getByText('Full description')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('renders close button in dialog header', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
})
