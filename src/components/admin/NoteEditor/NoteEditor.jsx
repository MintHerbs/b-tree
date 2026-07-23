import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, schemaCtx, serializerCtx } from '@milkdown/kit/core'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import CodeBlock from '../../social/CodeBlock/CodeBlock'
import {
  commonmark,
  codeBlockSchema,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
} from '@milkdown/kit/preset/commonmark'
import { gfm, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { history } from '@milkdown/kit/plugin/history'
import { math } from '@milkdown/plugin-math'
import { callCommand, replaceAll, getMarkdown, markdownToSlice, $prose, $view } from '@milkdown/kit/utils'
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react'
import 'katex/dist/katex.min.css'
import '@milkdown/kit/prose/view/style/prosemirror.css'
import styles from './NoteEditor.module.css'

/**
 * WYSIWYG note editor (T-036 foundation) — replaces the Monaco source editor.
 *
 * Contract preserved from Monaco: `content` is a Markdown string; the editor
 * parses it to a document on load and serialises back to Markdown on every
 * change into `onChange`. `useEditorState`/`useEditorSave`/`useEditorDrafts`
 * are unchanged — only the component producing `content` differs.
 *
 * The imperative ref exposes the toolbar/shortcut commands AdminEditor needs
 * so `EditorNavbar` and the Ctrl+B/I shortcuts drive editor commands instead
 * of Monaco `executeEdits`.
 */
const HEADING_LEVEL = { title: 1, subtitle: 2 }

// Strip markdown backslash-escapes that leak into LaTeX when a formula is
// copied from a markdown-escaped source (e.g. `a\_{11}` → `a_{11}` so it renders
// as a subscript). Never touches `\\` (a LaTeX row break) or `\{`/`\}`.
function unescapeMath(body) {
  return body.replace(/\\([_*#~|])/g, '$1')
}

// Normalise LaTeX so pasted formulas auto-render. remark-math only knows
// `$…$` / `$$…$$`, but LaTeX is commonly copied with `\[ … \]` (display) and
// `\( … \)` (inline) delimiters. Convert them to `$$`/`$` before parsing.
// Closing delimiters tolerate a missing backslash (`\[ … ]`), which some
// sources produce.
function normalizeLatexDelimiters(text) {
  return text
    // \[ … \] → $$ … $$   (display)
    .replace(/\\\[([\s\S]*?)\\?\]/g, (_, body) => `$$\n${unescapeMath(body.trim())}\n$$`)
    // \( … \) → $ … $     (inline)
    .replace(/\\\(([\s\S]*?)\\?\)/g, (_, body) => `$${unescapeMath(body.trim())}$`)
}

// Render fenced code blocks with the shared social CodeBlock (themed, read-only)
// so the editor matches the reader. Reuses the real React component via a
// react-dom root; no contentDOM => not inline-editable here (reveal-to-edit is
// T-037). The node's text stays in the doc model, so Markdown round-trip is
// unaffected. React root mount/unmount is deferred a microtask to stay clear of
// ProseMirror's synchronous view-update cycle.
const codeBlockView = $view(codeBlockSchema, () => (node) => {
  const dom = document.createElement('div')
  const root = createRoot(dom)
  const render = (n) => queueMicrotask(() => {
    try {
      root.render(<CodeBlock code={n.textContent} language={n.attrs.language || 'auto'} />)
    } catch { /* editor may have torn down */ }
  })
  render(node)
  return {
    dom,
    update: (updated) => {
      if (updated.type !== node.type) return false
      render(updated)
      return true
    },
    // React owns this subtree — keep ProseMirror's mutation observer out of it.
    ignoreMutation: () => true,
    stopEvent: () => false,
    destroy: () => queueMicrotask(() => root.unmount()),
  }
})

// Markdown-first clipboard. Milkdown's stock clipboard plugin only runs the
// Markdown parser when the clipboard is *pure* plain text; if any text/html is
// present (copying from a browser, a rendered source, or the editor itself) it
// takes the HTML branch and pasted `$x^2$` / fences stay literal. For a
// Markdown notes editor we always want pasted text parsed as Markdown, so this
// replaces the stock plugin:
//   • paste  → parse text/plain as Markdown (LaTeX, code, headings, lists all
//              auto-render); code blocks keep raw text.
//   • copy   → serialise the selection back to Markdown (so copying a formula
//              yields its `$…$` source).
const markdownClipboard = $prose((ctx) => new Plugin({
  key: new PluginKey('NOTE_EDITOR_MD_CLIPBOARD'),
  props: {
    handlePaste: (view, event) => {
      const clip = event.clipboardData
      if (!clip) return false
      // Inside a code block, paste raw text verbatim (don't re-parse).
      if (view.state.selection.$from.parent.type.spec.code) return false
      const text = clip.getData('text/plain')
      if (!text) return false
      let slice
      try {
        slice = markdownToSlice(normalizeLatexDelimiters(text))(ctx)
      } catch {
        return false
      }
      if (!slice || typeof slice === 'string') return false
      view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView())
      return true
    },
    clipboardTextSerializer: (slice) => {
      const serializer = ctx.get(serializerCtx)
      const schema = ctx.get(schemaCtx)
      const doc = schema.topNodeType.createAndFill(undefined, slice.content)
      return doc ? serializer(doc) : ''
    },
  },
}))

const MilkdownInner = forwardRef(function MilkdownInner({ content, onChange }, ref) {
  // `lastEmitted` tracks the Markdown the editor last produced. Incoming
  // `content` equal to it means "our own change echoed back" — skip the reset
  // so typing never fights the controlled prop (the ProseMirror feedback-loop
  // trap the ADR flags); a different value means an external load → replaceAll.
  // Starts empty and loads ALL content (incl. the first note) through the
  // guarded effect below, so we never depend on whether Milkdown emits on its
  // initial parse.
  const lastEmitted = useRef('')
  // Suppresses the markdownUpdated that a programmatic replaceAll triggers, so
  // loading a note doesn't mark it unsaved / re-normalise before the user edits.
  const applyingExternal = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, '')
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          if (applyingExternal.current) {
            applyingExternal.current = false
            lastEmitted.current = markdown
            return
          }
          lastEmitted.current = markdown
          onChangeRef.current?.(markdown)
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(math)
      .use(history)
      .use(markdownClipboard)
      .use(codeBlockView)
      .use(listener)
  )

  const [loading, getInstance] = useInstance()

  // Push external content changes (note load / draft restore / clear) into the
  // editor. Guarded so the editor's own emissions don't re-enter as resets.
  useEffect(() => {
    if (loading) return
    const incoming = content ?? ''
    if (incoming === lastEmitted.current) return
    applyingExternal.current = true
    lastEmitted.current = incoming
    getInstance()?.action(replaceAll(incoming))
  }, [content, loading, getInstance])

  useImperativeHandle(ref, () => ({
    isReady: () => !loading && !!getInstance(),
    getMarkdown() {
      const inst = getInstance()
      return inst ? inst.action(getMarkdown()) : ''
    },
    focus() {
      getInstance()?.action((ctx) => ctx.get(editorViewCtx).focus())
    },
    format(action) {
      const cmd = {
        bold: toggleStrongCommand,
        italic: toggleEmphasisCommand,
        strike: toggleStrikethroughCommand,
        code: toggleInlineCodeCommand,
      }[action]
      if (cmd) getInstance()?.action(callCommand(cmd.key))
    },
    setStyle(style) {
      const level = HEADING_LEVEL[style]
      const inst = getInstance()
      if (!inst) return
      if (level) inst.action(callCommand(wrapInHeadingCommand.key, level))
      else inst.action(callCommand(turnIntoTextCommand.key))
    },
  }), [loading, getInstance])

  return (
    <div className={styles.editorSurface}>
      <Milkdown />
    </div>
  )
})

const NoteEditor = forwardRef(function NoteEditor({ content, onChange }, ref) {
  return (
    <MilkdownProvider>
      <MilkdownInner content={content} onChange={onChange} ref={ref} />
    </MilkdownProvider>
  )
})

export default NoteEditor
