import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

describe('DropdownMenu', () => {
  it('renders trigger button', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('renders items inside content', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('renders with label and separator', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders checkbox items', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={true}>
            Show details
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Show preview
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Show details')).toBeInTheDocument()
    expect(screen.getByText('Show preview')).toBeInTheDocument()
  })

  it('renders radio items', () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="asc">
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Ascending')).toBeInTheDocument()
    expect(screen.getByText('Descending')).toBeInTheDocument()
  })

  it('renders svg icons in trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu <span data-testid="icon">▼</span></Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
