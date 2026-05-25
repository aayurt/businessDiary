import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/dynamic', () => ({
  default: () => {
    const MockMDEditor = ({ value, onChange, height }: any) => (
      <div data-testid="md-editor" data-value={value} data-height={height}>
        <textarea
          data-testid="md-textarea"
          defaultValue={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        />
      </div>
    )
    return MockMDEditor
  },
}))

vi.mock('@uiw/react-md-editor/markdown-editor.css', () => ({}))
vi.mock('@uiw/react-markdown-preview/markdown.css', () => ({}))

describe('MarkdownEditor', () => {
  it('renders with initial value', async () => {
    const { MarkdownEditor } = await import('@/components/ui/markdown-editor')
    render(<MarkdownEditor value="# Hello" onChange={() => {}} />)
    const textarea = screen.getByTestId('md-textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe('# Hello')
  })

  it('renders with default height', async () => {
    const { MarkdownEditor } = await import('@/components/ui/markdown-editor')
    render(<MarkdownEditor value="" onChange={() => {}} />)
    const editor = screen.getByTestId('md-editor')
    expect(editor.getAttribute('data-height')).toBe('400')
  })

  it('accepts custom height prop', async () => {
    const { MarkdownEditor } = await import('@/components/ui/markdown-editor')
    render(<MarkdownEditor value="" onChange={() => {}} height={600} />)
    const editor = screen.getByTestId('md-editor')
    expect(editor.getAttribute('data-height')).toBe('600')
  })

  it('calls onChange when text changes', async () => {
    const handleChange = vi.fn()
    const { MarkdownEditor } = await import('@/components/ui/markdown-editor')
    render(<MarkdownEditor value="" onChange={handleChange} />)
    const textarea = screen.getByTestId('md-textarea')
    fireEvent.change(textarea, { target: { value: 'new text' } })
    expect(handleChange).toHaveBeenCalledWith('new text')
  })
})
