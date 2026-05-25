import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

describe('Sheet', () => {
  it('renders trigger button', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
    expect(screen.getByRole('button', { name: /open sheet/i })).toBeInTheDocument()
  })

  it('renders content when triggered', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Side Panel</SheetTitle>
          <p>Sheet body content</p>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: /open/i }))
    expect(screen.getByText('Side Panel')).toBeInTheDocument()
    expect(screen.getByText('Sheet body content')).toBeInTheDocument()
  })

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Closable</SheetTitle>
          <SheetClose asChild>
            <Button>Close sheet</Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: /open/i }))
    expect(screen.getByText('Closable')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close sheet/i }))
    expect(screen.queryByText('Closable')).not.toBeInTheDocument()
  })

  it('renders with default right side', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Default Side</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: /open/i }))
    const content = screen.getByText('Default Side').closest('[role="dialog"]')
    expect(content?.className).toContain('inset-y-0')
    expect(content?.className).toContain('right-0')
  })

  it('renders SheetFooter', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>With Footer</SheetTitle>
          <SheetFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: /open/i }))
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('renders close X button', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>X Close</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: /open/i }))
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    expect(closeButtons.length).toBeGreaterThanOrEqual(1)
  })
})
