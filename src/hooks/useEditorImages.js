import { useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { colors } from '../constants/colors'
import { saveImageBlob, restoreDraftBlobs, nextImageKey } from '../lib/draftDB'

export function useEditorImages({ selectedPath, showToast, editorRef, fileInputRef, setContent, activeDraftId }) {
  const imageCountRef = useRef({})
  const imageQueueRef = useRef({})

  useEffect(() => {
    if (!activeDraftId) return
    const restore = async () => {
      try {
        const restored = await restoreDraftBlobs(activeDraftId)
        imageQueueRef.current = { ...imageQueueRef.current, ...restored }
      } catch {
        // IndexedDB unavailable — continue without restoring
      }
    }
    restore()
  }, [activeDraftId])

  function resolveAdminImageSrc(src = '') {
    if (!src.startsWith('/notes/img/')) return src

    const owner = import.meta.env.VITE_GITHUB_OWNER
    const repo = import.meta.env.VITE_GITHUB_REPO
    const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'

    if (!owner || !repo) return src

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${src}`
  }

  function createImageWidget(editor, monaco, src, alt, startPos, endPos, fullMatch, onDelete, onReplace) {
    const resolvedSrc = resolveAdminImageSrc(src)
    const widgetId = `image-widget-${startPos.lineNumber}-${startPos.column}`

    return {
      getId: () => widgetId,
      getDomNode: () => {
        const container = document.createElement('div')
        container.className = 'monaco-image-widget'
        container.style.cssText = `
        position: relative;
        display: inline-block;
        max-width: 400px;
        margin: 8px 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${colors.border};
        background: ${colors.surface};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        animation: imageWidgetFadeIn 200ms ease-out;
        z-index: 100;
      `

        container.addEventListener('mouseenter', () => {
          clearTimeout(editor._imageWidgetHideTimeout)
        })

        container.addEventListener('mouseleave', () => {
          editor._imageWidgetHideTimeout = setTimeout(() => {
            hideImageWidget(editor)
          }, 300)
        })

        const img = document.createElement('img')
        img.src = resolvedSrc
        img.alt = alt || 'Image'
        img.style.cssText = `
        display: block;
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
        cursor: pointer;
      `

        img.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          e.stopPropagation()
          showImageContextMenu(e, container, editor, startPos, endPos, onDelete, onReplace)
        })

        img.addEventListener('click', (e) => {
          e.stopPropagation()
          window.open(resolvedSrc, '_blank')
        })

        const caption = document.createElement('div')
        caption.textContent = src
        caption.style.cssText = `
        padding: 6px 10px;
        font-size: 11px;
        color: ${colors.textMuted};
        background: ${colors.surface};
        border-top: 1px solid ${colors.border};
        font-family: 'JetBrains Mono', monospace;
      `

        container.appendChild(img)
        container.appendChild(caption)

        return container
      },
      getPosition: () => ({
        position: {
          lineNumber: endPos.lineNumber,
          column: endPos.column,
        },
        preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
      })
    }
  }

  function hideImageWidget(editor) {
    if (editor._currentImageWidget) {
      editor.removeContentWidget(editor._currentImageWidget)
      editor._currentImageWidget = null
    }
  }

  function showImageContextMenu(e, container, editor, startPos, endPos, onDelete, onReplace) {
    const existingMenu = document.querySelector('.monaco-image-context-menu')
    if (existingMenu) existingMenu.remove()

    const menu = document.createElement('div')
    menu.className = 'monaco-image-context-menu'
    menu.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    min-width: 160px;
  `

    const replaceOption = createMenuOption('Replace image', () => {
      menu.remove()
      onReplace(editor, startPos, endPos)
    })

    const deleteOption = createMenuOption('Delete image', () => {
      menu.remove()
      onDelete(editor, startPos, endPos)
    }, colors.error)

    menu.appendChild(replaceOption)
    menu.appendChild(deleteOption)
    document.body.appendChild(menu)

    const closeMenu = (event) => {
      if (!menu.contains(event.target)) {
        menu.remove()
        document.removeEventListener('click', closeMenu)
      }
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 0)
  }

  function createMenuOption(text, onClick, color = colors.text) {
    const option = document.createElement('button')
    option.textContent = text
    option.style.cssText = `
    display: block;
    width: 100%;
    background: transparent;
    border: none;
    padding: 8px 12px;
    font-size: 13px;
    color: ${color};
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    transition: all 150ms ease;
    font-family: inherit;
  `

    option.addEventListener('mouseenter', () => {
      option.style.background = 'rgba(255, 255, 255, 0.06)'
    })

    option.addEventListener('mouseleave', () => {
      option.style.background = 'transparent'
    })

    option.addEventListener('click', onClick)

    return option
  }

  const handleImageDelete = (editor, startPos, endPos) => {
    const model = editor.getModel()
    if (!model) return

    const range = {
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
    }

    editor.executeEdits('', [{
      range,
      text: '',
    }])

    showToast('Image removed', 'success')
  }

  const handleImageReplace = (editor, startPos, endPos) => {
    if (fileInputRef.current) {
      editor._imageReplacePosition = { startPos, endPos }
      fileInputRef.current.click()
    }
  }

  const showImageWidget = (editor, monaco, src, alt, startPos, endPos, fullMatch) => {
    hideImageWidget(editor)

    const widget = createImageWidget(
      editor,
      monaco,
      src,
      alt,
      startPos,
      endPos,
      fullMatch,
      handleImageDelete,
      handleImageReplace
    )

    editor._currentImageWidget = widget
    editor.addContentWidget(widget)
  }

  const handleImageHover = (editor, monaco, e) => {
    if (!e.target || !e.target.position) return

    const model = editor.getModel()
    if (!model) return

    const position = e.target.position
    const text = model.getValue()
    const offset = model.getOffsetAt(position)

    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match

    while ((match = imageRegex.exec(text)) !== null) {
      const [fullMatch, alt, src] = match
      const startOffset = match.index
      const endOffset = startOffset + fullMatch.length

      if (offset >= startOffset && offset <= endOffset) {
        const startPos = model.getPositionAt(startOffset)
        const endPos = model.getPositionAt(endOffset)

        showImageWidget(editor, monaco, src, alt, startPos, endPos, fullMatch)
        return
      }
    }

    hideImageWidget(editor)
  }

  const renderInlineImages = (editor, monaco) => {
    if (!editor || !monaco) return

    const model = editor.getModel()
    if (!model) return

    const text = model.getValue()
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    const decorations = []
    let match

    while ((match = imageRegex.exec(text)) !== null) {
      const [fullMatch, alt, src] = match
      const startOffset = match.index
      const endOffset = startOffset + fullMatch.length
      const startPos = model.getPositionAt(startOffset)
      const endPos = model.getPositionAt(endOffset)

      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: {
          inlineClassName: 'monaco-image-markdown',
          hoverMessage: {
            value: `**Image Preview** - Hover to see preview, right-click to manage`,
            isTrusted: true
          },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      })
    }

    editor._imageDecorations = editor.deltaDecorations(
      editor._imageDecorations || [],
      decorations
    )

    if (!editor._imageHoverProviderRegistered) {
      editor.onMouseMove((e) => {
        handleImageHover(editor, monaco, e)
      })
      editor._imageHoverProviderRegistered = true
    }
  }

  const handleImageUpload = async (file) => {
    if (!selectedPath) {
      showToast('Please select a directory first', 'error')
      return
    }

    try {
      const ext = file.name.split('.').pop()
      const draftKey = nextImageKey(activeDraftId, ext)

      imageQueueRef.current[draftKey] = { file, ext }
      await saveImageBlob(draftKey, file)

      const imageMarkdown = `![image](draft://${draftKey})`

      if (editorRef.current) {
        const editor = editorRef.current

        if (editor._imageReplacePosition) {
          const { startPos, endPos } = editor._imageReplacePosition
          const range = {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          }
          editor.executeEdits('', [{
            range,
            text: imageMarkdown,
          }])
          editor._imageReplacePosition = null
        } else {
          const position = editor.getPosition()
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          }
          editor.executeEdits('', [{
            range,
            text: imageMarkdown,
          }])
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + imageMarkdown.length,
          })
        }

        editor.focus()
      } else {
        setContent(prev => prev + '\n' + imageMarkdown)
      }

      showToast('Image queued — will upload when you save', 'success')

    } catch (error) {
      console.error('Image queue failed:', error)
      showToast(`Failed to queue image: ${error.message}`, 'error')
    }
  }

  const handleFileInputChange = (e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])

  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      await handleImageUpload(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  })

  return {
    imageQueueRef,
    imageCountRef,
    handleImageUpload,
    handleFileInputChange,
    getRootProps,
    getInputProps,
    isDragActive,
    renderInlineImages,
    hideImageWidget,
  }
}
