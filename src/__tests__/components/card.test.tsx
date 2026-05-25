import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card components', () => {
  it('renders Card with children', () => {
    render(<Card><p>Content</p></Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Content').parentElement?.className).toContain('rounded-lg')
  })

  it('renders Card with custom className', () => {
    render(<Card className="custom-card"><p>Content</p></Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('custom-card')
  })

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description text')).toBeInTheDocument()
  })

  it('CardTitle has correct heading style', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    )
    const title = screen.getByText('Title')
    expect(title.className).toContain('text-2xl')
    expect(title.className).toContain('font-semibold')
  })

  it('CardDescription has muted style', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>
    )
    const desc = screen.getByText('Description')
    expect(desc.className).toContain('text-muted-foreground')
  })

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Card body content</CardContent>
      </Card>
    )
    expect(screen.getByText('Card body content')).toBeInTheDocument()
  })

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    )
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
  })

  it('composes full card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Composed Card</CardTitle>
          <CardDescription>With description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content area</p>
        </CardContent>
        <CardFooter>
          <span>Footer note</span>
        </CardFooter>
      </Card>
    )
    expect(screen.getByText('Composed Card')).toBeInTheDocument()
    expect(screen.getByText('With description')).toBeInTheDocument()
    expect(screen.getByText('Main content area')).toBeInTheDocument()
    expect(screen.getByText('Footer note')).toBeInTheDocument()
  })

  it('forwards ref to Card', () => {
    const ref = { current: null }
    render(<Card ref={ref}><p>Ref test</p></Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
