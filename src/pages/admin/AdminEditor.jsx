import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useDropzone } from 'react-dropzone'
import { colors } from '../../constants/colors'
import '../../styles/adminTokens.css'
import { MODULES } from '../../components/layout/Sidebar/modules'
import { listDirectory, uploadImage, commitFile, getFileContent, deleteFile } from '../../lib/githubApi'
import { useAdmin } from './useAdmin'
import EditorNavbar from '../../components/admin/EditorNavbar'
import DirectoryDrawer from '../../components/admin/DirectoryDrawer'
import PreviewModal from '../../components/admin/PreviewModal'
import UsersDrawer from '../../components/admin/UsersDrawer'
import ToastNotification, { useToast } from '../../components/admin/ToastNotification'
import { ADMIN_ICON_OPTIONS, getIconNameForComponent, getIconOptionByName } from '../../components/admin/adminIconOptions'
import { Monitor } from '@phosphor-icons/react'
import styles from './AdminEditor.module.css'

// Title to filename conversion
function titleToFilename(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const MODULES_JS_PATH = 'src/components/layout/Sidebar/modules.js'

function moduleToSource(module) {
  const lines = [
    '  {',
    `    id: '${module.id}',`,
    `    label: '${module.label}',`,
    `    Icon: ${module.iconName},`,
  ]

  if (module.notes) {
    lines.push('    notes: [')
    module.notes.forEach(note => {
      lines.push(`      { filename: '${note.filename}', label: '${note.label}' },`)
    })
    lines.push('    ],')
  }

  if (module.tools) {
    lines.push('    tools: [')
    module.tools.forEach(tool => {
      lines.push(`      { id: '${tool.id}', label: '${tool.label}', route: '${tool.route}' },`)
    })
    lines.push('    ],')
  }

  lines.push('  },')
  return lines.join('\n')
}

function ensureIconImport(modulesJs, iconName) {
  if (!iconName || modulesJs.includes(`  ${iconName},`) || modulesJs.includes(`  Function as ${iconName},`)) {
    return modulesJs
  }

  const importStart = modulesJs.indexOf('import {\n')
  const importEnd = modulesJs.indexOf("} from '@phosphor-icons/react'", importStart)

  if (importStart === -1 || importEnd === -1) {
    throw new Error('Could not update icon imports in modules.js')
  }

  const importLine = iconName === 'FunctionIcon'
    ? '  Function as FunctionIcon,'
    : `  ${iconName},`

  return `${modulesJs.slice(0, importEnd)}${importLine}\n${modulesJs.slice(importEnd)}`
}

function insertModuleSource(modulesJs, module) {
  if (modulesJs.includes(`id: '${module.id}'`)) {
    throw new Error(`Subject "${module.id}" already exists`)
  }

  const standaloneIndex = modulesJs.indexOf('export const STANDALONE_TOOLS')
  const moduleSection = standaloneIndex >= 0 ? modulesJs.slice(0, standaloneIndex) : modulesJs
  const rest = standaloneIndex >= 0 ? modulesJs.slice(standaloneIndex) : ''
  const arrayEnd = moduleSection.lastIndexOf('\n]')

  if (arrayEnd === -1) {
    throw new Error('Could not find MODULES array end')
  }

  return `${moduleSection.slice(0, arrayEnd)}\n${moduleToSource(module)}${moduleSection.slice(arrayEnd)}${rest}`
}

function removeModuleSource(modulesJs, moduleId) {
  const startPattern = new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`, 'm')
  const startMatch = modulesJs.match(startPattern)

  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find subject "${moduleId}" in modules.js`)
  }

  const start = startMatch.index
  let index = start + 1
  let depth = 0

  for (; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        let end = index + 1
        if (modulesJs[end] === ',') end += 1
        if (modulesJs[end] === '\r') end += 1
        if (modulesJs[end] === '\n') end += 1
        return `${modulesJs.slice(0, start)}\n${modulesJs.slice(end)}`
      }
    }
  }

  throw new Error(`Could not parse subject "${moduleId}" in modules.js`)
}

function findModuleBlock(modulesJs, moduleId) {
  const escapedId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startPattern = new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${escapedId}',`, 'm')
  const startMatch = modulesJs.match(startPattern)

  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find module: ${moduleId}`)
  }

  const start = startMatch.index
  let index = start + 1
  let depth = 0

  for (; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return {
          start,
          end: index + 1,
          source: modulesJs.slice(start, index + 1),
        }
      }
    }
  }

  throw new Error(`Could not parse module: ${moduleId}`)
}

function upsertNoteEntry(modulesJs, moduleId, newNoteEntry, notePath) {
  const block = findModuleBlock(modulesJs, moduleId)
  const source = block.source

  if (source.includes(`filename: '${notePath}'`)) {
    throw new Error('A note with this filename already exists')
  }

  const notesPattern = /(notes:\s*\[)([\s\S]*?)(\])/m
  const notesMatch = source.match(notesPattern)
  let updatedSource

  if (notesMatch) {
    updatedSource = source.replace(notesPattern, `$1$2      ${newNoteEntry}\n    $3`)
  } else {
    const toolsIndex = source.indexOf('\n    tools:')
    const notesSource = `\n    notes: [\n      ${newNoteEntry}\n    ],`

    if (toolsIndex !== -1) {
      updatedSource = `${source.slice(0, toolsIndex)}${notesSource}${source.slice(toolsIndex)}`
    } else {
      const closingIndex = source.lastIndexOf('\n  }')
      updatedSource = `${source.slice(0, closingIndex)}${notesSource}${source.slice(closingIndex)}`
    }
  }

  return `${modulesJs.slice(0, block.start)}${updatedSource}${modulesJs.slice(block.end)}`
}

function refreshModuleState(setModules, updater) {
  setModules(prev => updater(prev))
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

function resolveAdminImageSrc(src = '') {
  if (!src.startsWith('/notes/img/')) return src

  const owner = import.meta.env.VITE_GITHUB_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'

  if (!owner || !repo) return src

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${src}`
}

function extractMarkdownImages(markdown) {
  return [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(match => ({
    alt: match[1],
    src: match[2],
  }))
}

function AdminEditorContent() {
  const location = useLocation()
  const { user, profile, loading } = useAdmin()
  const { showToast } = useToast()
  
  // Editor state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unsaved, setUnsaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState(null) // { moduleId, subfolder }
  const [modules, setModules] = useState(MODULES)
  const [modulesLoading, setModulesLoading] = useState(true)
  const [currentStyle, setCurrentStyle] = useState('body')
  const [isTooNarrow, setIsTooNarrow] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  ))
  
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

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

  const unusedIconOptions = getUnusedIconOptions(modules)
  const imagePreviews = extractMarkdownImages(content)

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

  const handleEditorMount = (editor) => {
    editorRef.current = editor
    
    // Listen for cursor position changes to detect current style
    editor.onDidChangeCursorPosition(() => {
      detectCurrentStyle()
    })
  }

  const handleContentChange = (value) => {
    setContent(value || '')
    setUnsaved(true)
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

  // Image upload handler
  const handleImageUpload = async (file) => {
    if (!selectedPath) {
      showToast('Please select a directory first', 'error')
      return
    }

    try {
      showToast(`Uploading ${file.name}...`, 'success')
      
      // 1. Get current image count in public/notes/img/[moduleId]/
      const moduleId = selectedPath.moduleId
      const imgDir = `public/notes/img/${moduleId}`
      const existingFiles = await listDirectory(imgDir)
      const imageCount = existingFiles.length
      
      // 2. Rename file to (count + 1).[ext]
      const ext = file.name.split('.').pop()
      const newNumber = imageCount + 1
      const newFilename = `${newNumber}.${ext}`
      
      // 3. Upload to public/notes/img/[moduleId]/[number].[ext]
      const uploadPath = `${imgDir}/${newFilename}`
      const arrayBuffer = await file.arrayBuffer()
      await uploadImage(uploadPath, arrayBuffer)
      
      // 4. Insert into editor at cursor position
      const markdownPath = `/notes/img/${moduleId}/${newFilename}`
      const imageMarkdown = `![image](${markdownPath})`
      
      if (editorRef.current) {
        const editor = editorRef.current
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
        editor.focus()
      } else {
        setContent(prev => prev + '\n' + imageMarkdown)
      }
      
      showToast('Image uploaded and inserted', 'success')
      
    } catch (error) {
      console.error('Image upload failed:', error)
      showToast(`Upload failed: ${error.message}`, 'error')
    }
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

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }
    
    if (!selectedPath) {
      showToast('Please select a directory', 'error')
      return
    }
    
    setSaving(true)
    
    try {
      const filename = titleToFilename(title)
      if (!filename) {
        throw new Error('Invalid title - could not generate filename')
      }
      
      const { moduleId, subfolder } = selectedPath
      
      // Commit .md to GitHub
      const mdPath = `src/content/notes/${moduleId}/${subfolder}/${filename}.md`
      const commitMessage = `docs: add ${filename} to ${moduleId}/${subfolder}`
      
      await commitFile(mdPath, content, commitMessage)
      
      // Read current modules.js
      let currentModulesJs
      
      try {
        currentModulesJs = await getFileContent(MODULES_JS_PATH)
      } catch (error) {
        throw new Error(`Could not read modules.js: ${error.message}`)
      }
      
      if (!currentModulesJs) {
        throw new Error('modules.js file is empty or does not exist')
      }
      
      // Insert new note entry
      const newNoteEntry = `{ filename: '${subfolder}/${filename}', label: '${filename}.md' },`
      
      const updatedModulesJs = upsertNoteEntry(
        currentModulesJs,
        moduleId,
        newNoteEntry,
        `${subfolder}/${filename}`
      )
      
      await commitFile(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: add ${filename} to ${moduleId} notes`
      )
      
      showToast('Published! Vercel is deploying...', 'success')
      setUnsaved(false)
      
      // Clear form
      setTimeout(() => {
        setTitle('')
        setContent('')
      }, 2000)
      
    } catch (error) {
      console.error('Save failed:', error)
      showToast(`Save failed: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isModifierPressed = event.metaKey || event.ctrlKey
      if (!isModifierPressed) return

      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
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

  // Module management handlers
  const handleNewModule = async (name, iconName = unusedIconOptions[0]?.name || 'FileCode') => {
    const moduleId = titleToFilename(name)
    if (!moduleId) {
      showToast('Please enter a subject name', 'error')
      return
    }

    showToast(`Creating subject ${moduleId}...`, 'success')
    
    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const label = name.trim()
      const iconOption = getIconOptionByName(iconName)
      const newModule = {
        id: moduleId,
        label,
        iconName: iconOption.name,
        Icon: iconOption.Icon,
        notes: [],
        tools: [],
      }
      const updatedModulesJs = insertModuleSource(
        ensureIconImport(currentModulesJs, iconOption.name),
        newModule
      )

      await commitFile(
        `src/content/notes/${moduleId}/notes/.gitkeep`,
        '',
        `feat: create ${moduleId} notes folder`
      )
      await commitFile(
        `src/content/notes/${moduleId}/tools/.gitkeep`,
        '',
        `feat: add tools folder to ${moduleId}`
      )
      await commitFile(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: add ${moduleId} subject`
      )

      refreshModuleState(setModules, prev => [...prev, newModule])
      showToast(`Subject ${label} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subject: ${error.message}`, 'error')
    }
  }

  const handleDeleteModule = async (moduleId) => {
    showToast(`Removing subject ${moduleId}...`, 'success')

    try {
      const currentModulesJs = await getFileContent(MODULES_JS_PATH)
      const updatedModulesJs = removeModuleSource(currentModulesJs, moduleId)

      await commitFile(
        MODULES_JS_PATH,
        updatedModulesJs,
        `feat: remove ${moduleId} subject`
      )
      await deleteFile(
        `src/content/notes/${moduleId}/notes/.gitkeep`,
        `chore: remove ${moduleId} notes placeholder`
      )
      await deleteFile(
        `src/content/notes/${moduleId}/tools/.gitkeep`,
        `chore: remove ${moduleId} tools placeholder`
      )

      refreshModuleState(setModules, prev => prev.filter(module => module.id !== moduleId))
      setSelectedPath(prev => prev?.moduleId === moduleId ? null : prev)
      showToast(`Subject ${moduleId} removed from the filesystem`, 'success')
    } catch (error) {
      showToast(`Failed to remove subject: ${error.message}`, 'error')
    }
  }

  const handleNewSubfolder = async (moduleId, subfolderName) => {
    try {
      await commitFile(
        `src/content/notes/${moduleId}/${subfolderName}/.gitkeep`,
        '',
        `feat: add ${subfolderName} to ${moduleId}`
      )
      showToast(`Subfolder ${subfolderName} created`, 'success')
    } catch (error) {
      showToast(`Failed to create subfolder: ${error.message}`, 'error')
    }
  }

  const handleRenameSubfolder = async (moduleId, oldName, newName) => {
    showToast(`Renaming ${oldName} to ${newName}...`, 'success')
    // Implementation would update modules.js references
    showToast(`Subfolder renamed`, 'success')
  }

  const handleDeleteSubfolder = async (moduleId, subfolderName) => {
    showToast(`Deleting subfolder ${subfolderName}...`, 'success')
    // Implementation would update modules.js
    showToast(`Subfolder deleted`, 'success')
  }

  const handleMoveFile = async ({ fromModule, fromSubfolder, filename, toModule, toSubfolder }) => {
    showToast(`Moving ${filename}...`, 'success')
    
    try {
      // Read file content
      const oldPath = `src/content/notes/${fromModule}/${fromSubfolder}/${filename}`
      const fileContent = await getFileContent(oldPath)
      
      // Commit to new location
      const newPath = `src/content/notes/${toModule}/${toSubfolder}/${filename}`
      await commitFile(newPath, fileContent, `feat: move ${filename} to ${toModule}/${toSubfolder}`)
      
      // Delete from old location (would need delete API)
      // Update modules.js
      
      showToast(`File moved successfully`, 'success')
    } catch (error) {
      showToast(`Failed to move file: ${error.message}`, 'error')
    }
  }

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
        onNewModule={handleNewModule}
        onDeleteModule={handleDeleteModule}
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
        isOwner={profile?.role === 'owner'}
        username={profile?.username}
        onSignOut={handleSignOut}
        editorRef={editorRef}
        onFormatAction={handleFormatAction}
        onInsertImage={() => fileInputRef.current?.click()}
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
          {imagePreviews.length > 0 && (
            <div className={styles.imagePreviewPanel} aria-label="Inserted image previews">
              {imagePreviews.map((image, index) => (
                <figure className={styles.imagePreview} key={`${image.src}-${index}`}>
                  <img src={resolveAdminImageSrc(image.src)} alt={image.alt || 'Inserted image'} />
                  <figcaption>{image.src}</figcaption>
                </figure>
              ))}
            </div>
          )}
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
