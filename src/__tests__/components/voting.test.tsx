import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  ArrowBigUp: () => <span data-testid="icon-upvote">Up</span>,
  ArrowBigDown: () => <span data-testid="icon-downvote">Down</span>,
}))

describe('VoteButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders score and vote buttons', async () => {
    const { VoteButton } = await import('@/components/ui/vote-button')
    render(<VoteButton fileId="test-1" initialScore={42} />)
    expect(screen.getByText('42')).toBeTruthy()
    expect(screen.getByLabelText('Upvote')).toBeTruthy()
    expect(screen.getByLabelText('Downvote')).toBeTruthy()
  })

  it('renders with default score of 0', async () => {
    const { VoteButton } = await import('@/components/ui/vote-button')
    render(<VoteButton fileId="test-1" />)
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('shows active state for user upvote', async () => {
    const { VoteButton } = await import('@/components/ui/vote-button')
    render(<VoteButton fileId="test-1" userVote={1} />)
    const upBtn = screen.getByLabelText('Upvote')
    expect(upBtn.getAttribute('data-active')).toBe('true')
    const downBtn = screen.getByLabelText('Downvote')
    expect(downBtn.getAttribute('data-active')).toBe('false')
  })

  it('shows active state for user downvote', async () => {
    const { VoteButton } = await import('@/components/ui/vote-button')
    render(<VoteButton fileId="test-1" userVote={-1} />)
    const upBtn = screen.getByLabelText('Upvote')
    expect(upBtn.getAttribute('data-active')).toBe('false')
    const downBtn = screen.getByLabelText('Downvote')
    expect(downBtn.getAttribute('data-active')).toBe('true')
  })

  it('disables buttons while loading', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'))
    const { VoteButton } = await import('@/components/ui/vote-button')
    render(<VoteButton fileId="test-1" />)
    const upBtn = screen.getByLabelText('Upvote')
    upBtn.click()
    await waitFor(() => {
      const btn = screen.getByLabelText('Upvote')
      expect(btn.hasAttribute('disabled')).toBe(true)
    })
  })
})
