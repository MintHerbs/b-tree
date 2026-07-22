import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core'
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
} from '@milkdown/kit/preset/commonmark'
import { gfm, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { history } from '@milkdown/kit/plugin/history'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { math } from '@milkdown/plugin-math'
import { callCommand, replaceAll, getMarkdown } from '@milkdown/kit/utils'
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
      .use(clipboard)
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
