import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useDropzone } from 'react-dropzone'
import { colors } from '../../constants/colors'
import { supabase } from '../../lib/supabaseClient'
import '../../styles/adminTokens.css'
import { MODULES } from '../../components/layout/Sidebar/modules'
import { useAdmin } from './useAdmin'
import EditorNavbar from '../../components/admin/EditorNavbar'
import DirectoryDrawer from '../../components/admin/DirectoryDrawer'
import PreviewModal from '../../components/admin/PreviewModal'
import UsersDrawer from '../../components/admin/UsersDrawer'
import ImageCleanupDrawer from '../../components/admin/ImageCleanupDrawer'
import ChangePasswordModal from '../../components/admin/ChangePasswordModal'
import FormulaModal from '../../components/admin/FormulaModal'
import SocialLinkModal from '../../components/admin/SocialLinkModal'
import ToastNotification, { useToast } from '../../components/admin/ToastNotification'
import { ADMIN_ICON_OPTIONS, getIconNameForComponent } from '../../components/admin/adminIconOptions'
import { Monitor } from '@phosphor-icons/react'
import styles from './AdminEditor.module.css'
import { useEditorState } from '../../hooks/useEditorState'
import { useEditorSave } from '../../hooks/useEditorSave'
import { useEditorImages } from '../../hooks/useEditorImages'
import { useEditorModules } from '../../hooks/useEditorModules'
import { useEditorFormatting, renderInlineLaTeX } from '../../hooks/useEditorFormatting'
import { useEditorFiles } from '../../hooks/useEditorFiles'

function resolveAdminImageSrc(src = '') {
  if (!src.startsWith('/notes/img/')) return src

  const owner = import.meta.env.VITE_GITHUB_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'

  if (!owner || !repo) return src

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${src}`
}

// Create Monaco content widget for inline image preview
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

      // Keep widget visible when hovering over it
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

      // Context menu on right-click
      img.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        showImageContextMenu(e, container, editor, startPos, endPos, onDelete, onReplace)
      })

      // Click to view full size
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

// Helper function to hide widget (needs to be accessible)
function hideImageWidget(editor) {
  if (editor._currentImageWidget) {
    editor.removeContentWidget(editor._currentImageWidget)
    editor._currentImageWidget = null
  }
}

// Show context menu for image widget
function showImageContextMenu(e, container, editor, startPos, endPos, onDelete, onReplace) {
  // Remove any existing context menu
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

  // Close menu on click outside
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

function getUnusedIconOptions(modules, selectedIconName = null) {
  const usedIconNames = new Set(
    modules
      .map(module => getIconNameForComponent(module.Icon))
      .filter(Boolean)
  )

  return ADMIN_ICON_OPTIONS.filter(option => (
    option.name === selectedIconName || !usedIconNames.has(option.name)
  ))
}

function AdminEditorContent() {
  const location = useLocation()
  const { user, profile, loading } = useAdmin()
  const { showToast } = useToast()

  const {
    title, setTitle, content, setContent,
    unsaved, setUnsaved, saving, setSaving,
    directoryOpen, setDirectoryOpen, previewOpen, setPreviewOpen,
    usersOpen, setUsersOpen, changePasswordOpen, setChangePasswordOpen,
    formulaModalOpen, setFormulaModalOpen, socialLinkModalOpen, setSocialLinkModalOpen,
    selectedPath, setSelectedPath, originalPath, setOriginalPath, modules, setModules,
    modulesLoading, setModulesLoading, currentStyle, setCurrentStyle,
    isTooNarrow, setIsTooNarrow, editorRef, fileInputRef,
  } = useEditorState()

  const [cleanupOpen, setCleanupOpen] = useState(false)

  const unusedIconOptions = getUnusedIconOptions(modules)

  const { imageQueueRef, imageCountRef, handleImageUpload } = useEditorImages({
    selectedPath, showToast, editorRef, setContent,
  })

  const { handleSave } = useEditorSave({
    title, content, selectedPath, showToast, setSaving, setUnsaved, setTitle, setContent,
    imageQueueRef, imageCountRef, originalPath, setOriginalPath,
    isOwner: profile?.role === 'owner',
  })

  const {
    handleNewModule, handleDeleteModule, handleRenameModule,
    handleNewSubfolder, handleRenameSubfolder, handleDeleteSubfolder, handleMoveFile,
    handleDeleteFile, handleRenameFile,
  } = useEditorModules({
    showToast, setModules, setSelectedPath, unusedIconOptions,
    isOwner: profile?.role === 'owner',
  })

  const { handleFormatAction, handleStyleChange, detectCurrentStyle } = useEditorFormatting({
    editorRef, setCurrentStyle,
  })

  const { handleLoadFile } = useEditorFiles({
    showToast, setContent, setTitle, setUnsaved, setDirectoryOpen, setSelectedPath, setOriginalPath,
  })

  useEffect(() => {
    const handleResize = () => {
      setIsTooNarrow(window.innerWidth < 960)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (loading) return

    setModulesLoading(true)
    setModules(MODULES)

    const loadingTimer = window.setTimeout(() => {
      setModulesLoading(false)
    }, 250)

    return () => {
      window.clearTimeout(loadingTimer)
    }
  }, [loading])

  // Check for ?panel=users query param
  useEffect(() => {
    if (!loading && profile?.role === 'owner') {
      const params = new URLSearchParams(location.search)
      if (params.get('panel') === 'users') {
        setUsersOpen(true)
      }
    }
  }, [location.search, loading, profile])

  // Filter modules based on user permissions
  const visibleModules = profile?.role === 'owner'
    ? modules
    : modules.filter(m => profile?.allowed_directories?.includes(m.id))

  const allowedDirectories = profile?.role === 'owner'
    ? null
    : profile?.allowed_directories || []

  // Monaco theme setup
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
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor

    // Listen for cursor position changes to detect current style and toggle LaTeX edit mode
    editor.onDidChangeCursorPosition(() => {
      detectCurrentStyle()
      renderInlineLaTeX(editor, monaco)
    })

    // Render inline image and LaTeX decorations
    renderInlineImages(editor, monaco)
    renderInlineLaTeX(editor, monaco)

    // Re-render decorations when content changes
    editor.onDidChangeModelContent(() => {
      renderInlineImages(editor, monaco)
      renderInlineLaTeX(editor, monaco)
      // Hide widget when content changes (user is typing)
      hideImageWidget(editor)
    })

    // Hide widget when mouse leaves editor
    const editorDomNode = editor.getDomNode()
    if (editorDomNode) {
      editorDomNode.addEventListener('mouseleave', () => {
        editor._imageWidgetHideTimeout = setTimeout(() => {
          hideImageWidget(editor)
        }, 300)
      })
    }
  }

  // Render inline image previews as hover decorations
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

      // Add decoration for hover detection
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

    // Apply decorations
    editor._imageDecorations = editor.deltaDecorations(
      editor._imageDecorations || [],
      decorations
    )

    // Set up hover provider if not already done
    if (!editor._imageHoverProviderRegistered) {
      editor.onMouseMove((e) => {
        handleImageHover(editor, monaco, e)
      })
      editor._imageHoverProviderRegistered = true
    }
  }

  // Handle hover over image markdown
  const handleImageHover = (editor, monaco, e) => {
    if (!e.target || !e.target.position) return

    const model = editor.getModel()
    if (!model) return

    const position = e.target.position
    const text = model.getValue()
    const offset = model.getOffsetAt(position)

    // Find if cursor is over an image markdown
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match

    while ((match = imageRegex.exec(text)) !== null) {
      const [fullMatch, alt, src] = match
      const startOffset = match.index
      const endOffset = startOffset + fullMatch.length

      if (offset >= startOffset && offset <= endOffset) {
        const startPos = model.getPositionAt(startOffset)
        const endPos = model.getPositionAt(endOffset)

        // Show widget
        showImageWidget(editor, monaco, src, alt, startPos, endPos, fullMatch)
        return
      }
    }

    // Hide widget if not hovering over image
    hideImageWidget(editor)
  }

  // Show image widget on hover
  const showImageWidget = (editor, monaco, src, alt, startPos, endPos, fullMatch) => {
    // Remove existing widget
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

  // Delete image from editor
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

  // Replace image
  const handleImageReplace = (editor, startPos, endPos) => {
    // Trigger file input
    if (fileInputRef.current) {
      // Store position for replacement
      editor._imageReplacePosition = { startPos, endPos }
      fileInputRef.current.click()
    }
  }

  const handleContentChange = (value) => {
    setContent(value || '')
    setUnsaved(true)
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

  // Dropzone for canvas
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isModifierPressed = event.metaKey || event.ctrlKey
      if (!isModifierPressed) return

      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
        if (saving) return
        handleSave()
      } else if (key === 'b') {
        event.preventDefault()
        handleFormatAction('bold')
      } else if (key === 'i') {
        event.preventDefault()
        handleFormatAction('italic')
      } else if (event.shiftKey && key === 'p') {
        event.preventDefault()
        setPreviewOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, handleFormatAction])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!unsaved) return

      const message = 'You have unsaved changes. Leave anyway?'
      event.preventDefault()
      event.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [unsaved])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin'
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    )
  }

  if (isTooNarrow) {
    return (
      <div className={styles.responsiveGuard}>
        <Monitor size={32} weight="regular" />
        <p>Admin panel requires a larger screen.</p>
      </div>
    )
  }

  return (
    <div className={styles.adminEditor}>
      {/* Fixed overlays */}
      <DirectoryDrawer
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        modules={visibleModules}
        allowedDirectories={allowedDirectories}
        selectedPath={selectedPath}
        onSelectPath={setSelectedPath}
        isOwner={profile?.role === 'owner'}
        onNewSubfolder={handleNewSubfolder}
        onRenameSubfolder={handleRenameSubfolder}
        onDeleteSubfolder={handleDeleteSubfolder}
        onDeleteFile={handleDeleteFile}
        onRenameFile={handleRenameFile}
        onNewModule={handleNewModule}
        onDeleteModule={handleDeleteModule}
        onRenameModule={handleRenameModule}
        onLoadFile={handleLoadFile}
        onClearEditor={() => {
          setContent('')
          setTitle('')
          setUnsaved(false)
          setSelectedPath(null)
          setOriginalPath(null)
        }}
        onMoveFile={handleMoveFile}
        isLoading={modulesLoading}
        iconOptions={unusedIconOptions}
      />

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        content={content}
      />

      {profile?.role === 'owner' && (
        <UsersDrawer
          open={usersOpen}
          onClose={() => setUsersOpen(false)}
          currentUserId={user?.id}
          isOwner={profile?.role === 'owner'}
        />
      )}

      {profile?.role === 'owner' && (
        <ImageCleanupDrawer
          open={cleanupOpen}
          onClose={() => setCleanupOpen(false)}
          modules={modules}
          isOwner={profile?.role === 'owner'}
        />
      )}

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        userEmail={user?.email}
      />

      <FormulaModal
        open={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onInsert={handleInsertFormula}
      />

      <SocialLinkModal
        open={socialLinkModalOpen}
        onClose={() => setSocialLinkModalOpen(false)}
        onInsert={handleInsertFormula}
      />

      {/* Navbar Row 1 + Row 2 */}
      <EditorNavbar
        title={title}
        onTitleChange={setTitle}
        unsaved={unsaved}
        onToggleDirectory={() => setDirectoryOpen(!directoryOpen)}
        directoryOpen={directoryOpen}
        onPreview={() => setPreviewOpen(true)}
        onSave={handleSave}
        saving={saving}
        onToggleUsers={() => setUsersOpen(!usersOpen)}
        onToggleCleanup={() => setCleanupOpen(o => !o)}
        cleanupOpen={cleanupOpen}
        isOwner={profile?.role === 'owner'}
        username={profile?.username}
        onSignOut={handleSignOut}
        onChangePassword={() => setChangePasswordOpen(true)}
        editorRef={editorRef}
        onFormatAction={handleFormatAction}
        onInsertImage={() => fileInputRef.current?.click()}
        onInsertFormula={() => setFormulaModalOpen(true)}
        onInsertSocialLink={() => setSocialLinkModalOpen(true)}
        currentStyle={currentStyle}
        onStyleChange={handleStyleChange}
        onNewModule={handleNewModule}
        iconOptions={unusedIconOptions}
        onDeleteModule={() => selectedPath && handleDeleteModule(selectedPath.moduleId)}
      />

      {/* Canvas */}
      <div className={styles.canvas} {...getRootProps()}>
        <input {...getInputProps()} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />

        <div className={styles.writingArea}>
          {content === '' && (
            <div className={styles.emptyPlaceholder}>Start writing…</div>
          )}
          <Editor
            height="100%"
            defaultLanguage="markdown"
            theme="mooner-dark"
            value={content}
            onChange={handleContentChange}
            onMount={handleEditorMount}
            beforeMount={handleBeforeMount}
            options={{
              fontSize: 15,
              lineHeight: 28,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'off',
              scrollBeyondLastLine: true,
              renderLineHighlight: 'none',
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
              },
              padding: { top: 0, bottom: 120 },
            }}
          />
        </div>

        {isDragActive && (
          <div className={styles.dropOverlay}>
            <p>Drop images here...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminEditor() {
  return (
    <ToastNotification>
      <AdminEditorContent />
    </ToastNotification>
  )
}
