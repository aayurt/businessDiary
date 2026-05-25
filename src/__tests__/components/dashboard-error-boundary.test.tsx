import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span>AlertIcon</span>,
  RefreshCw: () => <span>RefreshIcon</span>,
  Home: () => <span>HomeIcon</span>,
}))

describe('DashboardErrorBoundary', () => {
  it('renders children when no error', async () => {
    const { DashboardErrorBoundary } = await import('@/components/dashboard/error-boundary')
    render(
      <DashboardErrorBoundary>
        <div>Dashboard Content</div>
      </DashboardErrorBoundary>
    )
    expect(screen.getByText('Dashboard Content')).toBeTruthy()
  })

  it('renders error UI on error', async () => {
    const { DashboardErrorBoundary } = await import('@/components/dashboard/error-boundary')
    const ThrowError = () => {
      throw new Error('Test error')
    }

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    )

    expect(screen.getByText('Dashboard Error')).toBeTruthy()
    expect(screen.getByText(/Test error/)).toBeTruthy()
    expect(screen.getByText('Try again')).toBeTruthy()
    expect(screen.getByText('Go home')).toBeTruthy()

    spy.mockRestore()
  })
})
