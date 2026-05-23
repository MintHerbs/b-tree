import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { colors } from '../../constants/colors'
import {
  Folder,
  FolderOpen,
  File,
  FolderPlus,
  DotsThreeVertical,
  X,
  Warning,
  FileMd
} from '@phosphor-icons/react'
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderContent,
  FileItem
} from '../animate-ui/components/radix/files'
import styles from './DirectoryDrawer.module.css'

export default function DirectoryDrawer({
  open,
  onClose,
  modules,
  allowedDirectories,
  selectedPath,
  onSelectPath,
  isOwner,
  onNewSubfolder,
  onRenameSubfolder,
  onDeleteSubfolder,
  onNewModule,
  onDeleteModule,
  onRenameModule,
  onMoveFile,
  onLoadFile,
  onClearEditor,
  onRestoreEditor,
  currentEditorState,
  isLoading = false,
  iconOptions = []
}) {
  const [mode, setMode] = useState('create') // 'create' or 'edit'
  const [savedEditorState, setSavedEditorState] = useState(null) // Save editor state when switching modes
  const [newSubfolderModule, setNewSubfolderModule] = useState(null)
  const [newSubfolderValue, setNewSubfolderValue] = useState('')
  const [renamingPath, setRenamingPath] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [addingNewModule, setAddingNewModule] = useState(false)
  const [newModuleValue, setNewModuleValue] = useState('')
  const [newModuleIcon, setNewModuleIcon] = useState(iconOptions[0]?.name || '')
  const [dragOverPath, setDragOverPath] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState({}) // Track which subfolders are expanded
  const [folderFiles, setFolderFiles] = useState({}) // Cache files for each folder
  const [loadingFiles, setLoadingFiles] = useState({}) // Track loading state per folder
  const [renamingModule, setRenamingModule] = useState(null)
  const [renameModuleValue, setRenameModuleValue] = useState('')

  const newSubfolderInputRef = useRef(null)
  const renameInputRef = useRef(null)
  const newModuleInputRef = useRef(null)

  // Filter modules based on allowedDirectories for contributors
  const visibleModules = allowedDirectories
    ? modules.filter(m => allowedDirectories.includes(m.id))
    : modules

  // Auto-focus inputs when they appear
  useEffect(() => {
    if (newSubfolderModule && newSubfolderInputRef.current) {
      newSubfolderInputRef.current.focus()
    }
  }, [newSubfolderModule])

  useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus()
    }
  }, [renamingPath])

  useEffect(() => {
    if (addingNewModule && newModuleInputRef.current) {
      newModuleInputRef.current.focus()
    }
  }, [addingNewModule])

  useEffect(() => {
    if (!iconOptions.some(option => option.name === newModuleIcon)) {
      setNewModuleIcon(iconOptions[0]?.name || '')
    }
  }, [iconOptions, newModuleIcon])

  const handleNewSubfolder = (moduleId) => {
    if (newSubfolderValue.trim()) {
      onNewSubfolder(moduleId, newSubfolderValue.trim())
      setNewSubfolderModule(null)
      setNewSubfolderValue('')
    }
  }

  const handleRename = () => {
    if (renameValue.trim() && renamingPath) {
      onRenameSubfolder(renamingPath.moduleId, renamingPath.oldName, renameValue.trim())
      setRenamingPath(null)
      setRenameValue('')
    }
  }

  const handleNewModule = () => {
    if (newModuleValue.trim()) {
      onNewModule(newModuleValue.trim(), newModuleIcon)
      setAddingNewModule(false)
      setNewModuleValue('')
    }
  }

  const handleRenameModule = () => {
    if (renameModuleValue.trim() && renamingModule) {
      onRenameModule(renamingModule, renameModuleValue.trim())
      setRenamingModule(null)
      setRenameModuleValue('')
    }
  }

  const toggleFolder = async (moduleId, subfolder) => {
    const key = `${moduleId}/${subfolder}`
    const isExpanded = expandedFolders[key]
    
    setExpandedFolders(prev => ({
      ...prev,
      [key]: !isExpanded
    }))

    // Load files if not already loaded and we're expanding
    if (!isExpanded && !folderFiles[key] && mode === 'edit') {
      await loadFolderFiles(moduleId, subfolder)
    }
  }

  const loadFolderFiles = async (moduleId, subfolder) => {
    const key = `${moduleId}/${subfolder}`
    setLoadingFiles(prev => ({ ...prev, [key]: true }))

    try {
      // Try to load files from the GitHub API
      const path = `src/content/notes/${moduleId}/${subfolder}`
      const { listDirectory } = await import('../../lib/githubApi')
      
      let files = []
      try {
        const result = await listDirectory(path)
        files = result
      } catch (error) {
        console.warn(`Failed to list directory ${path}:`, error)
        // If the directory doesn't exist or is empty, return empty array
        files = []
      }
      
      // Filter for markdown files only
      const mdFiles = files
        .filter(f => f && f.type === 'file' && f.name && f.name.endsWith('.md'))
        .map(f => ({
          name: f.name,
          path: f.path
        }))

      // If no files found via API, try to extract from modules.js
      if (mdFiles.length === 0) {
        const module = modules.find(m => m.id === moduleId)
        if (module && module.notes) {
          const notesInFolder = module.notes
            .filter(note => {
              const parts = note.filename.split('/')
              const noteSubfolder = parts.length > 1 ? parts[0] : 'notes'
              return noteSubfolder === subfolder
            })
            .map(note => {
              const fileName = note.filename.split('/').pop()
              return {
                name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
                path: `src/content/notes/${moduleId}/${note.filename}${note.filename.endsWith('.md') ? '' : '.md'}`
              }
            })
          
          setFolderFiles(prev => ({
            ...prev,
            [key]: notesInFolder
          }))
          setLoadingFiles(prev => ({ ...prev, [key]: false }))
          return
        }
      }

      setFolderFiles(prev => ({
        ...prev,
        [key]: mdFiles
      }))
    } catch (error) {
      console.error('Failed to load folder files:', error)
      setFolderFiles(prev => ({
        ...prev,
        [key]: []
      }))
    } finally {
      setLoadingFiles(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleFileClick = (filePath) => {
    if (onLoadFile) {
      onLoadFile(filePath)
    }
  }

  const handleDragStart = (e, moduleId, subfolder) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      fromModule: moduleId,
      fromSubfolder: subfolder,
      filename: 'placeholder.md' // This will be determined by the parent component
    }))
  }

  const handleDragOver = (e, moduleId, subfolder) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverPath({ moduleId, subfolder })
  }

  const handleDragLeave = () => {
    setDragOverPath(null)
  }

  const handleDrop = (e, toModule, toSubfolder) => {
    e.preventDefault()
    setDragOverPath(null)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.fromModule !== toModule || data.fromSubfolder !== toSubfolder) {
        onMoveFile({
          ...data,
          toModule,
          toSubfolder
        })
      }
    } catch (err) {
      console.error('Failed to parse drag data:', err)
    }
  }

  const isDragOver = (moduleId, subfolder) => {
    return dragOverPath?.moduleId === moduleId && dragOverPath?.subfolder === subfolder
  }

  const isSelected = (moduleId, subfolder) => {
    return selectedPath?.moduleId === moduleId && selectedPath?.subfolder === subfolder
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className={styles.backdrop} onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${mode === 'create' ? styles.active : ''}`}
              onClick={() => {
                if (mode === 'edit') {
                  // Save current editor state before clearing
                  if (currentEditorState && onClearEditor) {
                    setSavedEditorState(currentEditorState)
                    onClearEditor()
                  }
                }
                setMode('create')
              }}
            >
              Files
            </button>
            <button
              className={`${styles.modeButton} ${mode === 'edit' ? styles.active : ''}`}
              onClick={() => {
                if (mode === 'create' && savedEditorState && onRestoreEditor) {
                  // Restore saved editor state when switching back to edit mode
                  onRestoreEditor(savedEditorState)
                }
                setMode('edit')
              }}
            >
              Edit Files
            </button>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* File Tree */}
        <div className={styles.treeContainer}>
          {isLoading ? (
            <div className={styles.skeletonList} aria-label="Loading modules">
              <div className={styles.skeletonRow} />
              <div className={styles.skeletonRow} />
              <div className={styles.skeletonRow} />
            </div>
          ) : (
            <Files>
            {visibleModules.map(module => {
              const subfolders = module.notes
                ? [...new Set(module.notes.map(n => {
                    const parts = n.filename.split('/')
                    return parts.length > 1 ? parts[0] : 'notes'
                  }))]
                : ['notes', 'tools']

              return (
                <FolderItem key={module.id} value={module.id}>
                  <div className={styles.moduleRow}>
                    <FolderTrigger variant="parent">
                      {module.Icon && (
                        <module.Icon size={15} weight="regular" className={styles.moduleIcon} />
                      )}
                      {renamingModule === module.id ? (
                        <input
                          type="text"
                          className={styles.inlineInput}
                          value={renameModuleValue}
                          onChange={(e) => setRenameModuleValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameModule()
                            if (e.key === 'Escape') {
                              setRenamingModule(null)
                              setRenameModuleValue('')
                            }
                          }}
                          onBlur={handleRenameModule}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        module.label
                      )}
                    </FolderTrigger>
                    
                    {isOwner && (
                      <div className={styles.moduleActions}>
                        <button
                          className={styles.iconButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            setNewSubfolderModule(module.id)
                          }}
                          title="New subfolder"
                        >
                          <FolderPlus size={14} />
                        </button>
                        
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button
                              className={styles.iconButton}
                              onClick={(e) => e.stopPropagation()}
                              title="Module actions"
                            >
                              <DotsThreeVertical size={14} />
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className={styles.popoverContent} sideOffset={5}>
                              <button
                                className={styles.menuItem}
                                onClick={() => {
                                  setRenamingModule(module.id)
                                  setRenameModuleValue(module.label)
                                }}
                              >
                                Rename subject
                              </button>
                              <button
                                className={styles.menuItem}
                                onClick={() => {
                                  setDeleteConfirm({ type: 'module', moduleId: module.id })
                                }}
                              >
                                Delete subject
                              </button>
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      </div>
                    )}
                  </div>

                  <FolderContent>
                    {subfolders.map(subfolder => {
                      const isRenaming = renamingPath?.moduleId === module.id && 
                                        renamingPath?.subfolder === subfolder
                      const folderKey = `${module.id}/${subfolder}`
                      const isExpanded = expandedFolders[folderKey]
                      const files = folderFiles[folderKey] || []
                      const isLoadingFolder = loadingFiles[folderKey]

                      return (
                        <div key={subfolder}>
                          <div
                            className={`${styles.subfolderRow} ${
                              mode === 'create' && isSelected(module.id, subfolder) ? styles.selected : ''
                            } ${isDragOver(module.id, subfolder) ? styles.dragOver : ''}`}
                            onClick={() => {
                              if (mode === 'create') {
                                !isRenaming && onSelectPath({ moduleId: module.id, subfolder })
                              } else {
                                toggleFolder(module.id, subfolder)
                              }
                            }}
                            draggable={!isRenaming && mode === 'create'}
                            onDragStart={(e) => mode === 'create' && handleDragStart(e, module.id, subfolder)}
                            onDragOver={(e) => mode === 'create' && handleDragOver(e, module.id, subfolder)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => mode === 'create' && handleDrop(e, module.id, subfolder)}
                          >
                            <div className={styles.subfolderContent}>
                              {mode === 'edit' ? (
                                isExpanded ? <FolderOpen size={14} className={styles.fileIcon} /> : <Folder size={14} className={styles.fileIcon} />
                              ) : (
                                <Folder size={14} className={styles.fileIcon} />
                              )}
                              
                              {isRenaming ? (
                                <input
                                  ref={renameInputRef}
                                  type="text"
                                  className={styles.inlineInput}
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename()
                                    if (e.key === 'Escape') {
                                      setRenamingPath(null)
                                      setRenameValue('')
                                    }
                                  }}
                                  onBlur={handleRename}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className={styles.subfolderLabel}>{subfolder}</span>
                              )}
                            </div>

                            {isOwner && !isRenaming && (
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    className={styles.iconButton}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Subfolder actions"
                                  >
                                    <DotsThreeVertical size={14} />
                                  </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                  <Popover.Content className={styles.popoverContent} sideOffset={5}>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => {
                                        setRenamingPath({ moduleId: module.id, subfolder, oldName: subfolder })
                                        setRenameValue(subfolder)
                                      }}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => {
                                        setDeleteConfirm({ 
                                          type: 'subfolder', 
                                          moduleId: module.id, 
                                          subfolder 
                                        })
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            )}
                          </div>

                          {/* File list in edit mode */}
                          {mode === 'edit' && isExpanded && (
                            <div className={styles.fileList}>
                              {isLoadingFolder ? (
                                <div className={styles.fileItem}>
                                  <span className={styles.loadingText}>Loading files...</span>
                                </div>
                              ) : files.length === 0 ? (
                                <div className={styles.fileItem}>
                                  <span className={styles.emptyText}>No files found</span>
                                </div>
                              ) : (
                                files.map(file => (
                                  <div
                                    key={file.path}
                                    className={styles.fileItem}
                                    onClick={() => handleFileClick(file.path)}
                                  >
                                    <FileMd size={14} className={styles.fileIcon} />
                                    <span className={styles.fileName}>{file.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* New subfolder input */}
                    {newSubfolderModule === module.id && (
                      <div className={styles.subfolderRow}>
                        <div className={styles.subfolderContent}>
                          <File size={14} className={styles.fileIcon} />
                          <input
                            ref={newSubfolderInputRef}
                            type="text"
                            className={styles.inlineInput}
                            placeholder="Subfolder name..."
                            value={newSubfolderValue}
                            onChange={(e) => setNewSubfolderValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleNewSubfolder(module.id)
                              if (e.key === 'Escape') {
                                setNewSubfolderModule(null)
                                setNewSubfolderValue('')
                              }
                            }}
                            onBlur={() => {
                              if (newSubfolderValue.trim()) {
                                handleNewSubfolder(module.id)
                              } else {
                                setNewSubfolderModule(null)
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </FolderContent>
                </FolderItem>
              )
            })}

            {/* New module input */}
            {isOwner && addingNewModule && (
              <div className={styles.newModuleRow}>
                <Folder size={14} className={styles.fileIcon} />
                <input
                  ref={newModuleInputRef}
                  type="text"
                  className={styles.inlineInput}
                  placeholder="Module name..."
                  value={newModuleValue}
                  onChange={(e) => setNewModuleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewModule()
                    if (e.key === 'Escape') {
                      setAddingNewModule(false)
                      setNewModuleValue('')
                    }
                  }}
                  onBlur={() => {
                    if (newModuleValue.trim()) {
                      handleNewModule()
                    } else {
                      setAddingNewModule(false)
                    }
                  }}
                />
                {iconOptions.length > 0 && (
                  <div className={styles.iconPicker} aria-label="Choose subject icon">
                    {iconOptions.map(option => (
                      <button
                        key={option.name}
                        type="button"
                        className={`${styles.iconChoice} ${newModuleIcon === option.name ? styles.selectedIconChoice : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setNewModuleIcon(option.name)}
                        title={option.label}
                      >
                        <option.Icon size={16} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </Files>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {selectedPath && (
            <div className={styles.selectedPath}>
              Saving to: {selectedPath.moduleId} / {selectedPath.subfolder}
            </div>
          )}
          
          {isOwner && (
            <button
              className={styles.newModuleButton}
              onClick={() => setAddingNewModule(true)}
            >
              <FolderPlus size={14} />
              New Subject
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popover */}
      {deleteConfirm && (
        <Popover.Root open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <Popover.Anchor className={styles.popoverAnchor} />
          <Popover.Portal>
            <Popover.Content className={styles.confirmPopover} sideOffset={5}>
              <div className={styles.confirmHeader}>
                <Warning size={18} weight="bold" style={{ color: colors.warning }} />
                <span className={styles.confirmTitle}>
                  {deleteConfirm.type === 'module' ? 'Delete subject?' : 'Delete folder?'}
                </span>
              </div>
              <p className={styles.confirmMessage}>
                {deleteConfirm.type === 'module'
                  ? `Delete ${deleteConfirm.moduleId}? It will be removed from the app filesystem.`
                  : `Delete this folder? Notes inside will be orphaned.`}
              </p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmCancel}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmDelete}
                  onClick={() => {
                    if (deleteConfirm.type === 'module') {
                      onDeleteModule(deleteConfirm.moduleId)
                    } else {
                      onDeleteSubfolder(deleteConfirm.moduleId, deleteConfirm.subfolder)
                    }
                    setDeleteConfirm(null)
                  }}
                >
                  Delete
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </>
  )
}
