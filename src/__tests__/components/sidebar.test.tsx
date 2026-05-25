import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUsePathname = vi.fn(() => '/dashboard')

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet">{children}</div>
  ),
  SheetContent: ({ children, side }: { children: React.ReactNode; side: string }) => (
    <div data-testid="sheet-content" data-side={side}>{children}</div>
  ),
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
}))

vi.mock('lucide-react', () => ({
  Home: () => <span data-testid="icon-home">HomeIcon</span>,
  LayoutDashboard: () => <span data-testid="icon-dashboard">DashboardIcon</span>,
  Menu: () => <span data-testid="icon-menu">MenuIcon</span>,
  X: () => <span data-testid="icon-x">XIcon</span>,
}))

describe('AppSidebar', () => {
  it('renders navigation links', async () => {
    const { AppSidebar } = await import('@/components/app-sidebar')
    render(<AppSidebar />)
    const links = screen.getAllByRole('link')
    const homeLinks = links.filter((l) => l.getAttribute('href') === '/')
    const dashboardLinks = links.filter((l) => l.getAttribute('href') === '/dashboard')
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('shows app name in navigation', async () => {
    const { AppSidebar } = await import('@/components/app-sidebar')
    render(<AppSidebar />)
    const headings = screen.getAllByText('Next.js App')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders mobile menu trigger', async () => {
    const { AppSidebar } = await import('@/components/app-sidebar')
    render(<AppSidebar />)
    const trigger = screen.getByTestId('sheet-trigger')
    expect(trigger).toBeTruthy()
  })

  it('marks active link with data-active attribute', async () => {
    mockUsePathname.mockReturnValue('/dashboard')
    const { AppSidebar } = await import('@/components/app-sidebar')
    render(<AppSidebar />)
    const dashboardLinks = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/dashboard')
    expect(dashboardLinks[0]?.getAttribute('data-active')).toBe('true')
  })

  it('marks inactive link without data-active when on different page', async () => {
    mockUsePathname.mockReturnValue('/')
    const { AppSidebar } = await import('@/components/app-sidebar')
    render(<AppSidebar />)
    const dashboardLinks = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/dashboard')
    expect(dashboardLinks[0]?.getAttribute('data-active')).toBe('false')
  })
})
