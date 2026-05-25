import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Select,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

describe('Select', () => {
  it('renders trigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
      </Select>
    )
    expect(screen.getByText('Select option')).toBeInTheDocument()
  })

  it('renders trigger with chevron icon', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies disabled state to trigger', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('renders default placeholder when no value', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Default placeholder" />
        </SelectTrigger>
      </Select>
    )
    expect(screen.getByText('Default placeholder')).toBeInTheDocument()
  })

  it('renders trigger with button role', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Click me" />
        </SelectTrigger>
      </Select>
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger.tagName).toBe('BUTTON')
  })
})
