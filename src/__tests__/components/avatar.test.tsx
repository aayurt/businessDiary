import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('renders with fallback initials', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('has round shape', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('rounded-full')
  })

  it('renders without image when src is absent', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows fallback when image is rendered', () => {
    render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders multiple avatars', () => {
    render(
      <div>
        <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>CD</AvatarFallback></Avatar>
      </div>
    )
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.getByText('CD')).toBeInTheDocument()
  })

  it('applies custom className to Avatar', () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('custom-avatar')
  })

  it('applies custom className to AvatarFallback', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback className="custom-fallback">FB</AvatarFallback>
      </Avatar>
    )
    const fallback = container.querySelector('.custom-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback?.textContent).toBe('FB')
  })
})
