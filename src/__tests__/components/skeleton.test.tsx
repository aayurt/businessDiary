import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('renders base skeleton', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('rounded-md')
    expect(el.className).toContain('bg-muted')
    expect(el.className).toContain('h-4')
    expect(el.className).toContain('w-20')
  })

  it('renders SkeletonCard with 3 skeleton children', () => {
    const { container } = render(<SkeletonCard />)
    const children = container.querySelector('.space-y-3')
    expect(children?.children.length).toBe(3)
  })

  it('SkeletonCard has border and padding classes', () => {
    const { container } = render(<SkeletonCard />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('rounded-lg')
    expect(wrapper.className).toContain('border')
  })

  it('renders SkeletonTable with 5 rows', () => {
    const { container } = render(<SkeletonTable />)
    const rows = container.querySelectorAll('.space-y-3 > .flex')
    expect(rows.length).toBe(5)
  })

  it('renders SkeletonChart', () => {
    const { container } = render(<SkeletonChart />)
    const items = container.querySelectorAll('.animate-pulse')
    expect(items.length).toBeGreaterThanOrEqual(1)
  })

  it('SkeletonChart has a chart area skeleton', () => {
    const { container } = render(<SkeletonChart />)
    const roundedItems = container.querySelectorAll('.rounded-lg')
    expect(roundedItems.length).toBeGreaterThanOrEqual(1)
  })

  it('renders multiple skeleton types together', () => {
    const { container } = render(
      <div>
        <SkeletonCard />
        <SkeletonTable />
        <SkeletonChart />
      </div>
    )
    const allSkeletons = container.querySelectorAll('.animate-pulse')
    expect(allSkeletons.length).toBeGreaterThan(0)
  })

  it('SkeletonCard has correct internal structure', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelector('.h-4')).toBeInTheDocument()
    expect(container.querySelector('.h-8')).toBeInTheDocument()
    expect(container.querySelector('.h-3')).toBeInTheDocument()
  })
})
