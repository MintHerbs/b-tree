import katex from 'katex'
import 'katex/dist/katex.min.css'
import { colors } from '../constants/colors'

// Clear all active LaTeX view zones and legacy content widgets from editor
export function clearLatexWidgets(editor) {
  if (editor._latexWidgets) {
    editor._latexWidgets.forEach(widget => editor.removeContentWidget(widget))
  }
  editor._latexWidgets = []
  // View zones are removed inside the changeViewZones callback in renderInlineLaTeX
}

// CSS class per platform for the inline SocialLink token shown in Monaco.
const SOCIAL_TOKEN_CLASS = {
  youtube: 'monaco-social-token-youtube',
  instagram: 'monaco-social-token-instagram',
  linkedin: 'monaco-social-token-linkedin',
}

export function clearInlineWidgets(editor) {
  if (!editor) return

  if (editor._inlineWidgets) {
    editor._inlineWidgets.forEach(w => editor.removeContentWidget(w))
  }
  editor._inlineWidgets = []

  editor._inlineWidgetDecorations = editor.deltaDecorations(
    editor._inlineWidgetDecorations || [],
    []
  )

  if (editor._inlineViewZoneIds) {
    editor.changeViewZones(accessor => {
      editor._inlineViewZoneIds.forEach(id => accessor.removeZone(id))
    })
  }
  editor._inlineViewZoneIds = []
}

export function renderInlineWidgets(editor, monaco) {
  if (!editor || !monaco) return

  // Re-entrancy guard. Applying the injected-text decorations below makes
  // Monaco synchronously emit an onDidChangeCursorPosition event (the injected
  // token shifts the cursor's visual column). That handler calls
  // renderInlineWidgets again, and invoking deltaDecorations while the outer
  // call is still committing throws:
  //   "Invoking deltaDecorations recursively could lead to leaking decorations."
  // Bail out of the nested call — same pattern as _isRenderingLaTeX.
  //
  // We must also bail while renderInlineLaTeX is committing. The mount handler
  // wires the cursor handler to call *both* routines, so when renderInlineLaTeX
  // applies its own decorations/view zones (which likewise shift layout and emit
  // a synchronous cursor event), that event re-enters renderInlineWidgets with
  // _isRenderingWidgets still false — and our deltaDecorations below would then
  // recurse into LaTeX's in-flight deltaDecorations and throw. The two
  // decoration-committing routines must be mutually exclusive.
  if (editor._isRenderingWidgets || editor._isRenderingLaTeX) return

  const model = editor.getModel()
  if (!model) return

  editor._isRenderingWidgets = true
  try {
    renderInlineWidgetsInner(editor, monaco, model)
  } finally {
    editor._isRenderingWidgets = false
  }
}

function renderInlineWidgetsInner(editor, monaco, model) {
  const text = model.getValue()

  // ── 1. Find SocialLink tags ───────────────────────────────────────────
  const socialLinkRegex = /<SocialLink([\s\S]*?)\/>/g
  const socialLinks = []
  let match

  while ((match = socialLinkRegex.exec(text)) !== null) {
    const props = parseInlineProps(match[1])
    socialLinks.push({
      raw: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      props,
    })
  }

  // ── 2. Clear previously rendered widgets up front. Doing this before the
  //        early return also clears decorations when the last tag is deleted.
  clearInlineWidgets(editor)

  if (socialLinks.length === 0) return

  // ── 3. Track cursor (don't hide a tag the user is editing) ────────────
  const cursorOffset = model.getOffsetAt(editor.getPosition())

  // ── 4. Render SocialLink chips ────────────────────────────────────────
  const decorations = []

  editor.changeViewZones(accessor => {
    socialLinks.forEach(item => {
      const startPos = model.getPositionAt(item.startOffset)
      const endPos = model.getPositionAt(item.endOffset)

      // Skip if cursor is inside the tag (user is editing the raw markup)
      if (cursorOffset >= item.startOffset && cursorOffset <= item.endOffset) return

      const platform = (item.props.platform ?? 'youtube').toLowerCase()
      const title = item.props.title ?? ''
      const tokenClass = SOCIAL_TOKEN_CLASS[platform] ?? SOCIAL_TOKEN_CLASS.youtube

      // Hide the raw <SocialLink .../> markup and inject a compact inline
      // token in its place, e.g. "[youtube] My title". Clicking it places the
      // cursor inside the tag, which reveals the raw markup again for editing.
      const options = {
        inlineClassName: 'monaco-inline-widget-hidden',
        before: {
          content: `[${platform}]`,
          inlineClassName: `monaco-social-token ${tokenClass}`,
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      }
      if (title) {
        options.after = {
          content: ` ${title}`,
          inlineClassName: 'monaco-social-token-title',
        }
      }

      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber, startPos.column,
          endPos.lineNumber, endPos.column
        ),
        options,
      })
    })
  })

  editor._inlineWidgetDecorations = editor.deltaDecorations(
    editor._inlineWidgetDecorations || [],
    decorations
  )
}

// ── Prop parser ───────────────────────────────────────────────────────────
// Parses a string of JSX-like props into a plain object
// Handles: platform="youtube"  title="My video"  data="base64..."
function parseInlineProps(propsString) {
  const result = {}
  const regex = /(\w+)="([^"]*)"/g
  let m
  while ((m = regex.exec(propsString)) !== null) {
    result[m[1]] = m[2].replace(/&quot;/g, '"')
  }
  return result
}

// Render LaTeX inline / block preview dynamically in Monaco
export function renderInlineLaTeX(editor, monaco) {
  if (!editor || !monaco) return

  // Prevent infinite recursive event loops synchronously
  if (editor._isRenderingLaTeX) return

  const model = editor.getModel()
  if (!model) return

  // Debounce updates to avoid Monaco's synchronous rendering/layout event cycle conflicts
  if (editor._latexRenderTimeout) {
    clearTimeout(editor._latexRenderTimeout)
  }

  editor._latexRenderTimeout = setTimeout(() => {
    // Mutually exclusive with renderInlineWidgets: never commit LaTeX
    // decorations while a widget commit is in flight (see the matching guard in
    // renderInlineWidgets) — doing so would re-enter Monaco's deltaDecorations.
    if (editor._isRenderingLaTeX || editor._isRenderingWidgets) return
    editor._isRenderingLaTeX = true

    try {
      const text = model.getValue()
      const selection = editor.getSelection()

      // If no selection yet (initial mount), treat cursor as outside all formulas so all get rendered
      const selectionStart = selection ? model.getOffsetAt(selection.getStartPosition()) : -1
      const selectionEnd = selection ? model.getOffsetAt(selection.getEndPosition()) : -1

      const formulas = []

      // 1. Scan for block formulas: $$formula$$
      const blockRegex = /\$\$([\s\S]*?)\$\$/g
      let match
      while ((match = blockRegex.exec(text)) !== null) {
        formulas.push({
          type: 'block',
          raw: match[0],
          latex: match[1],
          startOffset: match.index,
          endOffset: match.index + match[0].length
        })
      }

      // 2. Scan for inline formulas: $formula$ (making sure not to overlap with block formulas)
      const inlineRegex = /\$([^$\n]+)\$/g
      while ((match = inlineRegex.exec(text)) !== null) {
        const startOffset = match.index
        const endOffset = startOffset + match[0].length

        // Check if this overlaps with any block formulas
        const overlaps = formulas.some(f =>
          (startOffset >= f.startOffset && startOffset < f.endOffset) ||
          (endOffset > f.startOffset && endOffset <= f.endOffset)
        )

        if (!overlaps) {
          formulas.push({
            type: 'inline',
            raw: match[0],
            latex: match[1],
            startOffset,
            endOffset
          })
        }
      }

      // Optimization: Check which formulas are active (overlapping with cursor/selection)
      const activeFormulaIndexes = formulas
        .map((f, idx) => {
          const cursorOverlaps = !(selectionEnd < f.startOffset || selectionStart > f.endOffset)
          return cursorOverlaps ? idx : null
        })
        .filter(val => val !== null)

      // State Signature optimization to prevent redrawing/flickering and layout churn
      const stateSignature = `${text.length}-${formulas.length}-${activeFormulaIndexes.join(',')}`
      if (editor._lastLatexStateSignature === stateSignature) {
        return
      }
      editor._lastLatexStateSignature = stateSignature

      // Clear legacy content widgets
      clearLatexWidgets(editor)

      const decorations = []

      // Use view zones so each rendered formula occupies its own line — no overlap possible
      editor.changeViewZones((accessor) => {
        // Remove previous view zones
        ;(editor._latexViewZoneIds || []).forEach(id => accessor.removeZone(id))
        editor._latexViewZoneIds = []

        formulas.forEach((f, idx) => {
          const startPos = model.getPositionAt(f.startOffset)
          const endPos = model.getPositionAt(f.endOffset)

          if (activeFormulaIndexes.includes(idx)) {
            // User is editing this formula — show raw text, no zone
            return
          }

          // Build the zone DOM node
          const domNode = document.createElement('div')
          const isBlock = f.type === 'block'
          domNode.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: ${isBlock ? 'center' : 'flex-start'};
            padding: ${isBlock ? '14px 24px' : '8px 16px'};
            cursor: pointer;
            border-left: 2px solid rgba(139, 92, 246, 0.35);
            background: rgba(139, 92, 246, 0.04);
            border-radius: 0 6px 6px 0;
            overflow: visible;
            box-sizing: border-box;
            color: #ffffff;
            transition: background 150ms ease, border-color 150ms ease;
          `

          let renderedHtml
          try {
            renderedHtml = katex.renderToString(f.latex, {
              displayMode: isBlock,
              throwOnError: true,
              output: 'html'
            })
          } catch (err) {
            // Skip this view zone entirely if rendering fails
            console.warn('Skipping formula due to KaTeX error:', err.message, 'Formula:', f.latex)
            return
          }

          domNode.innerHTML = renderedHtml

          domNode.addEventListener('click', () => {
            editor.setPosition({
              lineNumber: startPos.lineNumber,
              column: startPos.column + (isBlock ? 2 : 1)
            })
            editor.focus()
          })
          domNode.addEventListener('mouseenter', () => {
            domNode.style.background = 'rgba(139, 92, 246, 0.10)'
            domNode.style.borderLeftColor = 'rgba(139, 92, 246, 0.65)'
          })
          domNode.addEventListener('mouseleave', () => {
            domNode.style.background = 'rgba(139, 92, 246, 0.04)'
            domNode.style.borderLeftColor = 'rgba(139, 92, 246, 0.35)'
          })

          // Hide the raw LaTeX text
          decorations.push({
            range: new monaco.Range(
              startPos.lineNumber, startPos.column,
              endPos.lineNumber, endPos.column
            ),
            options: {
              inlineClassName: 'monaco-latex-hidden',
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
          })

          const zoneId = accessor.addZone({
            afterLineNumber: endPos.lineNumber,
            heightInPx: isBlock ? 80 : 52,
            domNode,
            suppressMouseDown: false,
          })
          editor._latexViewZoneIds.push(zoneId)
        })
      })

      // Apply hidden-text decorations
      editor._latexDecorations = editor.deltaDecorations(
        editor._latexDecorations || [],
        decorations
      )
    } catch (e) {
      console.error('Error rendering LaTeX in Monaco Editor:', e)
    } finally {
      editor._isRenderingLaTeX = false
    }
  }, 16) // ~1 frame delay to batch updates smoothly
}

export function useEditorFormatting({ editorRef, setCurrentStyle, renderInlineImages, hideImageWidget }) {
  const handleBeforeMount = (monaco) => {
    monaco.editor.defineTheme('mooner-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': colors.bg,
        'editor.foreground': colors.text,
        'editorLineNumber.foreground': colors.border,
        'editor.selectionBackground': `${colors.accent}40`,
        'editor.lineHighlightBackground': 'transparent',
      }
    })

    if (!document.querySelector('style[data-monaco-inline-widget-hidden="true"]')) {
      // Inject CSS to hide raw widget text and style the inline SocialLink token
      const styleEl = document.createElement('style')
      styleEl.setAttribute('data-monaco-inline-widget-hidden', 'true')
      styleEl.textContent = `
        .monaco-inline-widget-hidden { display: none !important; }
        .monaco-social-token {
          font-weight: 700;
          border-radius: 5px;
          padding: 0 5px;
        }
        .monaco-social-token-youtube { color: #ff4d4d; background: rgba(255, 77, 77, 0.12); }
        .monaco-social-token-instagram { color: #ff5fa2; background: rgba(225, 48, 108, 0.16); }
        .monaco-social-token-linkedin { color: #5aa9e6; background: rgba(0, 119, 181, 0.18); }
        .monaco-social-token-title { color: rgba(255, 255, 255, 0.55); }
      `
      document.head.appendChild(styleEl)
    }
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor

    editor.onDidChangeCursorPosition(() => {
      detectCurrentStyle()
      renderInlineLaTeX(editor, monaco)
      renderInlineWidgets(editor, monaco)
    })

    renderInlineImages(editor, monaco)
    renderInlineLaTeX(editor, monaco)
    renderInlineWidgets(editor, monaco)

    editor.onDidChangeModelContent(() => {
      renderInlineImages(editor, monaco)
      renderInlineLaTeX(editor, monaco)
      renderInlineWidgets(editor, monaco)
      hideImageWidget(editor)
    })

    const editorDomNode = editor.getDomNode()
    if (editorDomNode) {
      editorDomNode.addEventListener('mouseleave', () => {
        editor._imageWidgetHideTimeout = setTimeout(() => {
          hideImageWidget(editor)
        }, 300)
      })
    }
  }

  // Detect current line style (title/subtitle/body)
  const detectCurrentStyle = () => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const position = editor.getPosition()
    const model = editor.getModel()
    const lineContent = model.getLineContent(position.lineNumber)

    if (lineContent.startsWith('# ')) {
      setCurrentStyle('title')
    } else if (lineContent.startsWith('## ')) {
      setCurrentStyle('subtitle')
    } else {
      setCurrentStyle('body')
    }
  }

  // Formatting actions
  const handleFormatAction = (action) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    const model = editor.getModel()
    const selectedText = model.getValueInRange(selection)

    let newText = ''

    switch (action) {
      case 'bold':
        newText = selectedText ? `**${selectedText}**` : '**bold**'
        break
      case 'italic':
        newText = selectedText ? `*${selectedText}*` : '*italic*'
        break
      case 'strike':
        newText = selectedText ? `~~${selectedText}~~` : '~~strikethrough~~'
        break
      case 'code':
        newText = '```\n\n```'
        break
      default:
        return
    }

    editor.executeEdits('', [{
      range: selection,
      text: newText,
    }])

    // Move cursor appropriately
    if (action === 'code') {
      const position = editor.getPosition()
      editor.setPosition({
        lineNumber: position.lineNumber + 1,
        column: 1,
      })
    } else if (!selectedText) {
      const position = editor.getPosition()
      const offset = action === 'bold' ? 2 : 1
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column - (action === 'bold' ? 2 : (action === 'strike' ? 2 : 1)),
      })
    }

    editor.focus()
  }

  // Style change (title/subtitle/body)
  const handleStyleChange = (style) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const position = editor.getPosition()
    const model = editor.getModel()
    const lineContent = model.getLineContent(position.lineNumber)

    // Strip existing # or ##
    let cleanedLine = lineContent.replace(/^##?\s*/, '')

    // Add new prefix
    let newLine = cleanedLine
    if (style === 'title') {
      newLine = `# ${cleanedLine}`
    } else if (style === 'subtitle') {
      newLine = `## ${cleanedLine}`
    }

    // Replace the line
    editor.executeEdits('', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: lineContent.length + 1,
      },
      text: newLine,
    }])

    editor.focus()
    setCurrentStyle(style)
  }

  const handleInsertFormula = (formula) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()

    editor.executeEdits('', [{
      range: selection,
      text: formula,
    }])

    editor.focus()
  }

  return { handleBeforeMount, handleEditorMount, handleFormatAction, handleStyleChange, detectCurrentStyle, handleInsertFormula }
}
