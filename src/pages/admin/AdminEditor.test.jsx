import { describe, it, expect, vi, afterEach } from 'vitest'

// AdminEditor transitively imports DirectoryDrawer, which pulls in the
// animate-ui file-tree component via the `@/` path alias. That alias is
// configured in vite.config.js but not in vitest.config.js, so importing the
// real DirectoryDrawer here fails to resolve. It is irrelevant to the shortcut
// handler under test, so stub it out (vi.mock is hoisted above the import).
vi.mock('../../components/admin/DirectoryDrawer', () => ({ default: () => null }))

import { createEditorShortcutHandler } from './AdminEditor'

// Regression for Issue #13: the keydown listener is bound to `window`, so before
// the fix Ctrl/Cmd+B and Ctrl/Cmd+I ran handleFormatAction (mutating the Monaco
// document) and called preventDefault even when focus was in the title input or
// any other field. The fix gates the *formatting* shortcuts on the Monaco
// editor actually holding focus (editor.hasTextFocus()), while leaving Save and
// Preview global.
//
// These tests install the handler on `window` exactly as the component does and
// dispatch real keydown events, so they exercise the window-level firing path
// that caused the bug.

let installedHandler = null

afterEach(() => {
  if (installedHandler) window.removeEventListener('keydown', installedHandler)
  installedHandler = null
})

function makeEditorRef(focused) {
  // Mirrors editorRef.current being a Monaco editor instance (or null before
  // mount). hasTextFocus() is Monaco's "is the text area focused" check.
  return { current: focused === null ? null : { hasTextFocus: () => focused } }
}

function install({ focused, saveDraftNow = vi.fn(), handleFormatAction = vi.fn(), openPreview = vi.fn() }) {
  installedHandler = createEditorShortcutHandler({
    editorRef: makeEditorRef(focused),
    saveDraftNow,
    handleFormatAction,
    openPreview,
  })
  window.addEventListener('keydown', installedHandler)
  return { saveDraftNow, handleFormatAction, openPreview }
}

function pressCtrl(key, { shiftKey = false } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: true,
    shiftKey,
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
  return event
}

describe('AdminEditor shortcuts — Issue #13: formatting keys only fire when Monaco is focused', () => {
  it('does NOT run bold formatting (nor block native behaviour) when the editor is unfocused', () => {
    const { handleFormatAction } = install({ focused: false })

    const event = pressCtrl('b')

    expect(handleFormatAction).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('does NOT run italic formatting when the editor is unfocused', () => {
    const { handleFormatAction } = install({ focused: false })

    const event = pressCtrl('i')

    expect(handleFormatAction).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('does NOT run formatting when the editor is not mounted yet (ref is null)', () => {
    const { handleFormatAction } = install({ focused: null })

    const event = pressCtrl('b')

    expect(handleFormatAction).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('runs bold formatting and prevents default when the editor IS focused', () => {
    const { handleFormatAction } = install({ focused: true })

    const event = pressCtrl('b')

    expect(handleFormatAction).toHaveBeenCalledWith('bold')
    expect(event.defaultPrevented).toBe(true)
  })

  it('runs italic formatting and prevents default when the editor IS focused', () => {
    const { handleFormatAction } = install({ focused: true })

    const event = pressCtrl('i')

    expect(handleFormatAction).toHaveBeenCalledWith('italic')
    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps Save (Ctrl+S) global — it fires regardless of editor focus', () => {
    const { saveDraftNow } = install({ focused: false })

    const event = pressCtrl('s')

    expect(saveDraftNow).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps Preview (Ctrl+Shift+P) global — it fires regardless of editor focus', () => {
    const { openPreview } = install({ focused: false })

    const event = pressCtrl('p', { shiftKey: true })

    expect(openPreview).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })
})
