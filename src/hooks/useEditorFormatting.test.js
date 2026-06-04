import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderInlineWidgets, renderInlineLaTeX } from './useEditorFormatting'

// A fake Monaco editor/model that reproduces the real re-entrancy hazard:
//
//  1. deltaDecorations throws if called while another deltaDecorations call is
//     still on the stack — exactly the guard Monaco itself enforces with
//     "Invoking deltaDecorations recursively could lead to leaking decorations."
//  2. Applying decorations synchronously fires the registered
//     onDidChangeCursorPosition handler — modelling how injected-text
//     decorations shift the cursor's visual column and make Monaco emit a
//     cursor event mid-commit.
//
// handleEditorMount wires that cursor handler to call renderInlineWidgets, so
// without a re-entrancy guard the apply-decorations call recurses into a
// clear-decorations call and Monaco throws.
function createMockEditor(text) {
  const cursorHandlers = []
  const stats = { deltaCalls: 0, maxDepth: 0, lastApplied: null }
  let depth = 0
  let cursorFireGuard = 0

  const model = {
    getValue: () => text,
    // Cursor sits past the end of the tag so the widget is rendered
    // (renderInlineWidgets skips tags the cursor is inside).
    getOffsetAt: () => 9999,
    getPositionAt: (offset) => ({ lineNumber: 1, column: (offset ?? 0) + 1 }),
  }

  const editor = {
    getModel: () => model,
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    removeContentWidget: () => {},
    setPosition: () => {},
    focus: () => {},
    onDidChangeCursorPosition: (handler) => cursorHandlers.push(handler),
    changeViewZones: (cb) => cb({ addZone: () => 'zone-id', removeZone: () => {} }),
    deltaDecorations: (oldIds, newDecorations) => {
      if (depth > 0) {
        throw new Error(
          'Invoking deltaDecorations recursively could lead to leaking decorations.'
        )
      }
      depth += 1
      stats.deltaCalls += 1
      stats.maxDepth = Math.max(stats.maxDepth, depth)
      stats.lastApplied = newDecorations
      try {
        // Simulate Monaco firing a synchronous cursor-position change as a
        // side effect of applying decorations. Cap re-fires so a regression
        // (missing guard that also somehow avoids the throw) cannot hang.
        if (cursorFireGuard < 50) {
          cursorFireGuard += 1
          cursorHandlers.forEach((h) => h())
        }
        return newDecorations.map((_, i) => `dec-${i}`)
      } finally {
        depth -= 1
      }
    },
  }

  const monaco = {
    Range: class {
      constructor(sl, sc, el, ec) {
        this.startLineNumber = sl
        this.startColumn = sc
        this.endLineNumber = el
        this.endColumn = ec
      }
    },
    editor: {
      TrackedRangeStickiness: { NeverGrowsWhenTypingAtEdges: 1 },
    },
  }

  // Wire the cursor handler exactly as handleEditorMount does.
  editor.onDidChangeCursorPosition(() => renderInlineWidgets(editor, monaco))

  return { editor, monaco, stats }
}

describe('renderInlineWidgets — deltaDecorations re-entrancy', () => {
  it('does not invoke deltaDecorations recursively when applying widgets triggers a cursor event', () => {
    const { editor, monaco, stats } = createMockEditor(
      '<SocialLink platform="youtube" href="https://y.t/x" title="Hi" />'
    )

    expect(() => renderInlineWidgets(editor, monaco)).not.toThrow()

    // The whole point: deltaDecorations is never re-entered.
    expect(stats.maxDepth).toBe(1)
    // And it still did its job — at least one decoration was applied.
    expect(stats.lastApplied.length).toBeGreaterThan(0)
  })

  it('renders the social-link decoration with hidden raw text + injected token', () => {
    const { editor, monaco, stats } = createMockEditor(
      '<SocialLink platform="instagram" href="https://i.g/x" title="Reel" />'
    )

    renderInlineWidgets(editor, monaco)

    const deco = stats.lastApplied.find(
      (d) => d.options?.before?.content === '[instagram]'
    )
    expect(deco).toBeTruthy()
    expect(deco.options.inlineClassName).toBe('monaco-inline-widget-hidden')
    expect(deco.options.after.content).toBe(' Reel')
  })

  it('clears decorations and does not throw when all tags are removed', () => {
    const { editor, monaco, stats } = createMockEditor('just plain text, no tags')

    expect(() => renderInlineWidgets(editor, monaco)).not.toThrow()
    expect(stats.maxDepth).toBeLessThanOrEqual(1)
  })
})

// A second fake editor that supports BOTH renderInlineLaTeX and
// renderInlineWidgets, wired the way handleEditorMount wires the real cursor
// handler: a cursor-position change runs renderInlineLaTeX *and*
// renderInlineWidgets.
//
// This reproduces the cross-function recursion the per-function guard misses:
// renderInlineLaTeX's (debounced) deltaDecorations commit fires a synchronous
// cursor event; the handler then calls renderInlineWidgets while LaTeX's
// deltaDecorations is still on the stack. Without a shared guard,
// renderInlineWidgets calls deltaDecorations re-entrantly and Monaco throws
// "Invoking deltaDecorations recursively could lead to leaking decorations."
function createLatexAndWidgetEditor(text) {
  const cursorHandlers = []
  // reentrantAttempts counts every time deltaDecorations is invoked while
  // another deltaDecorations is still on the stack — i.e. exactly the leak
  // Monaco guards against. The real renderInlineLaTeX swallows the resulting
  // throw in its own try/catch, so a thrown error never surfaces to the caller;
  // this counter is what actually proves the recursion did (or didn't) happen.
  const stats = { deltaCalls: 0, maxDepth: 0, reentrantAttempts: 0 }
  let depth = 0
  let cursorFireGuard = 0

  const model = {
    getValue: () => text,
    // Cursor parked far past every tag/formula so all of them render
    // (both routines skip ranges the cursor is inside).
    getOffsetAt: () => 9999,
    getPositionAt: (offset) => ({ lineNumber: 1, column: (offset ?? 0) + 1 }),
  }

  const editor = {
    getModel: () => model,
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    getSelection: () => ({
      getStartPosition: () => ({ lineNumber: 1, column: 1 }),
      getEndPosition: () => ({ lineNumber: 1, column: 1 }),
    }),
    removeContentWidget: () => {},
    setPosition: () => {},
    focus: () => {},
    onDidChangeCursorPosition: (handler) => cursorHandlers.push(handler),
    changeViewZones: (cb) => cb({ addZone: () => 'zone-id', removeZone: () => {} }),
    deltaDecorations: (oldIds, newDecorations) => {
      if (depth > 0) {
        stats.reentrantAttempts += 1
        throw new Error(
          'Invoking deltaDecorations recursively could lead to leaking decorations.'
        )
      }
      depth += 1
      stats.deltaCalls += 1
      stats.maxDepth = Math.max(stats.maxDepth, depth)
      try {
        // Applying decorations fires a synchronous cursor event (capped so a
        // regression can't hang the test).
        if (cursorFireGuard < 50) {
          cursorFireGuard += 1
          cursorHandlers.forEach((h) => h())
        }
        return newDecorations.map((_, i) => `dec-${i}`)
      } finally {
        depth -= 1
      }
    },
  }

  const monaco = {
    Range: class {
      constructor(sl, sc, el, ec) {
        this.startLineNumber = sl
        this.startColumn = sc
        this.endLineNumber = el
        this.endColumn = ec
      }
    },
    editor: {
      TrackedRangeStickiness: { NeverGrowsWhenTypingAtEdges: 1 },
    },
  }

  // Wire the cursor handler exactly as handleEditorMount does: both routines.
  editor.onDidChangeCursorPosition(() => {
    renderInlineLaTeX(editor, monaco)
    renderInlineWidgets(editor, monaco)
  })

  return { editor, monaco, stats }
}

describe('renderInlineLaTeX × renderInlineWidgets — cross-function re-entrancy', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not recurse into deltaDecorations when a LaTeX commit fires a cursor event that re-enters renderInlineWidgets', () => {
    vi.useFakeTimers()
    const { editor, monaco, stats } = createLatexAndWidgetEditor(
      'intro $$x$$ and <SocialLink platform="youtube" href="https://y.t/x" title="Hi" /> outro'
    )

    // renderInlineLaTeX is debounced; flushing its timer triggers the commit
    // whose synchronous cursor event re-enters renderInlineWidgets.
    renderInlineLaTeX(editor, monaco)
    vi.runAllTimers()

    // The LaTeX commit actually happened (the recursion path was exercised)…
    expect(stats.deltaCalls).toBeGreaterThan(0)
    // …and deltaDecorations was never invoked re-entrantly. (renderInlineLaTeX
    // swallows the would-be throw, so this counter — not a thrown error — is
    // what catches the regression.)
    expect(stats.reentrantAttempts).toBe(0)
    expect(stats.maxDepth).toBe(1)
  })
})
