import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import FormulaModal from './FormulaModal'

// vitest globals are disabled, so Testing Library's auto-cleanup is not
// registered — unmount between tests so DOM nodes don't accumulate.
afterEach(() => cleanup())

const typeLatex = (container, value) => {
  const textarea = container.querySelector('textarea')
  fireEvent.change(textarea, { target: { value } })
  return textarea
}

describe('FormulaModal — Issue #7: no setState during render', () => {
  it('does not update state as a side effect of rendering across edits', () => {
    // Regression for Issue #7: renderPreview() was invoked during JSX render and
    // called setError(...) as a side effect. Setting state during render makes
    // React re-enter render to apply the update; across a sequence of edits this
    // diverges into "Too many re-renders" (React's infinite-loop guard) and logs
    // a render-phase warning. With the error derived in useMemo, none of this
    // happens. Spy on console.error and drive a realistic edit sequence:
    // invalid -> valid -> invalid (the displayMode/error interplay the buggy
    // render path mishandled).
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const { container } = render(
        <FormulaModal open onClose={() => {}} onInsert={() => {}} />
      )

      // None of these edits may throw or trigger a render-phase warning.
      expect(() => {
        typeLatex(container, '\\frac{a}{')   // invalid
        typeLatex(container, 'x^2 + y^2')    // valid
        typeLatex(container, '\\sqrt{')      // invalid again
      }).not.toThrow()

      const renderWarnings = errorSpy.mock.calls.filter(([msg]) =>
        typeof msg === 'string' &&
        /update.*while rendering|update during|existing state transition|too many re-renders|maximum update depth/i.test(
          msg
        )
      )
      expect(renderWarnings).toHaveLength(0)
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('still surfaces the validation error for invalid LaTeX (now derived, not set in render)', () => {
    const { container, getByText } = render(
      <FormulaModal open onClose={() => {}} onInsert={() => {}} />
    )

    typeLatex(container, '\\frac{a}{')

    // The derived error is shown in the error block.
    expect(getByText('Error:')).toBeInTheDocument()
  })

  it('renders a preview and no error for valid LaTeX', () => {
    const { container, queryByText } = render(
      <FormulaModal open onClose={() => {}} onInsert={() => {}} />
    )

    typeLatex(container, 'x^2 + y^2 = z^2')

    // KaTeX output is injected into the preview; no error block.
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(queryByText('Error:')).toBeNull()
  })

  it('inserts valid LaTeX and blocks insertion of invalid LaTeX', () => {
    const onInsert = vi.fn()
    const onClose = vi.fn()
    const { container, getByRole } = render(
      <FormulaModal open onClose={onClose} onInsert={onInsert} />
    )

    // Invalid LaTeX disables the Insert button and must not insert.
    typeLatex(container, '\\frac{a}{')
    const insertButton = getByRole('button', { name: 'Insert Formula' })
    expect(insertButton).toBeDisabled()
    fireEvent.click(insertButton)
    expect(onInsert).not.toHaveBeenCalled()

    // Valid LaTeX inserts the inline-wrapped formula and closes the modal.
    typeLatex(container, 'x^2')
    expect(insertButton).not.toBeDisabled()
    fireEvent.click(insertButton)
    expect(onInsert).toHaveBeenCalledWith('$x^2$')
    expect(onClose).toHaveBeenCalled()
  })
})
