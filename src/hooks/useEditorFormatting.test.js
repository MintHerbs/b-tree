import { describe, it, expect } from 'vitest'
import { renderInlineWidgets } from './useEditorFormatting'

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
