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
} from '../animate-ui/components/radix/files'
import { displaySubfolder } from '../../lib/notesApi'
import styles from './DirectoryDrawer.module.css'

// Files for a subfolder are derived from the module's DB-backed notes
// (module.notes = [{ filename, label }], where filename is the note's path).
// Each row carries the note identity { moduleId, path } the editor loads by.
function filesForFolder(module, subfolder) {
  return (module.notes ?? [])
    .filter(n => displaySubfolder(n.filename) === subfolder)
    .map(n => ({
      name: n.label || `${n.filename.split('/').pop()}.md`,
      path: n.filename,
      moduleId: module.id,
    }))
}

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
  onDeleteFile,
  onRenameFile,
  onNewModule,
  onDeleteModule,
  onRenameModule,
  onMoveFile,
  onLoadFile,
  onClearEditor,
  isLoading = false,
  iconOptions = []
}) {
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
  const [renamingModule, setRenamingModule] = useState(null)
  const [renameModuleValue, setRenameModuleValue] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [renameFileValue, setRenameFileValue] = useState('')

  const newSubfolderInputRef = useRef(null)
  const renameInputRef = useRef(null)
  const newModuleInputRef = useRef(null)
  const renameFileInputRef = useRef(null)

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
    if (renamingFile && renameFileInputRef.current) {
      renameFileInputRef.current.focus()
    }
  }, [renamingFile])

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

  const handleRenameFile = async () => {
    if (renameFileValue.trim() && renamingFile) {
      // The registry refreshes from the DB after the rename, so the row list
      // re-renders on its own — no manual reload needed.
      await onRenameFile(renamingFile.moduleId, renamingFile.path, renameFileValue.trim())
      setRenamingFile(null)
      setRenameFileValue('')
    }
  }

  const toggleFolder = (moduleId, subfolder) => {
    const key = `${moduleId}/${subfolder}`
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleNewFileInFolder = (moduleId, subfolder) => {
    onClearEditor?.()
    onSelectPath({ moduleId, subfolder })
  }

  const handleFileClick = (file) => {
    if (onLoadFile) onLoadFile({ moduleId: file.moduleId, path: file.path })
  }

  // Notes are dragged, not subfolders — the drag source is a file row carrying
  // its DB identity. onMoveFile resolves the move by path.
  const handleDragStart = (e, moduleId, subfolder, file) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      fromModule: moduleId,
      fromSubfolder: subfolder,
      fromPath: file.path,
      filename: file.name,
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

  const handleDrop = async (e, toModule, toSubfolder) => {
    e.preventDefault()
    setDragOverPath(null)

    let data
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json'))
    } catch (err) {
      console.error('Failed to parse drag data:', err)
      return
    }

    if (data.fromModule === toModule && data.fromSubfolder === toSubfolder) return

    await onMoveFile({
      fromModule: data.fromModule,
      fromSubfolder: data.fromSubfolder,
      fromPath: data.fromPath,
      toModule,
      toSubfolder,
    })
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
          <span className={styles.title}>Files</span>
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
              const derivedSubfolders = module.notes
                ? [...new Set(module.notes.map(n => displaySubfolder(n.filename)))]
                : []
              const explicitSubfolders = module.subfolders ?? []
              // A folder created empty (no notes yet) only shows up via
              // `explicitSubfolders`; once it has notes it also shows up via
              // `derivedSubfolders` — merge both. Only fall back to the
              // hardcoded default when a module has neither kind at all.
              const subfolders = derivedSubfolders.length > 0 || explicitSubfolders.length > 0
                ? [...new Set([...derivedSubfolders, ...explicitSubfolders])]
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
                      const files = filesForFolder(module, subfolder)

                      return (
                        <div key={subfolder}>
                          <div
                            className={`${styles.subfolderRow} ${
                              isSelected(module.id, subfolder) ? styles.selected : ''
                            } ${isDragOver(module.id, subfolder) ? styles.dragOver : ''}`}
                            onClick={() => !isRenaming && toggleFolder(module.id, subfolder)}
                            onDragOver={(e) => handleDragOver(e, module.id, subfolder)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, module.id, subfolder)}
                          >
                            <div className={styles.subfolderContent}>
                              {isExpanded ? <FolderOpen size={14} className={styles.fileIcon} /> : <Folder size={14} className={styles.fileIcon} />}

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

                            {!isRenaming && (
                              <div className={styles.subfolderActions}>
                                <button
                                  className={styles.iconButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNewFileInFolder(module.id, subfolder)
                                  }}
                                  title="New file"
                                >
                                  <File size={14} />
                                </button>

                                {isOwner && (
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
                            )}
                          </div>

                          {/* File list */}
                          {isExpanded && (
                            <div className={styles.fileList}>
                              {files.length === 0 ? (
                                <div className={styles.fileItem}>
                                  <span className={styles.emptyText}>No files found</span>
                                </div>
                              ) : (
                                files.map(file => {
                                  const isRenamingFile = renamingFile?.moduleId === module.id &&
                                    renamingFile?.path === file.path

                                  return (
                                    <div
                                      key={file.path}
                                      className={styles.fileItem}
                                      onClick={() => !isRenamingFile && handleFileClick(file)}
                                      draggable={!isRenamingFile}
                                      onDragStart={(e) => handleDragStart(e, module.id, subfolder, file)}
                                    >
                                      <div className={styles.fileContent}>
                                        <FileMd size={14} className={styles.fileIcon} />
                                        {isRenamingFile ? (
                                          <input
                                            ref={renameFileInputRef}
                                            type="text"
                                            className={styles.inlineInput}
                                            value={renameFileValue}
                                            onChange={(e) => setRenameFileValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleRenameFile()
                                              if (e.key === 'Escape') {
                                                setRenamingFile(null)
                                                setRenameFileValue('')
                                              }
                                            }}
                                            onBlur={handleRenameFile}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <span className={styles.fileName}>{file.name}</span>
                                        )}
                                      </div>

                                      {!isRenamingFile && (
                                        <Popover.Root>
                                          <Popover.Trigger asChild>
                                            <button
                                              className={styles.iconButton}
                                              onClick={(e) => e.stopPropagation()}
                                              title="File actions"
                                            >
                                              <DotsThreeVertical size={14} />
                                            </button>
                                          </Popover.Trigger>
                                          <Popover.Portal>
                                            <Popover.Content className={styles.popoverContent} sideOffset={5}>
                                              <button
                                                className={styles.menuItem}
                                                onClick={() => {
                                                  setRenamingFile({ moduleId: module.id, subfolder, path: file.path })
                                                  setRenameFileValue(file.name.replace(/\.md$/, ''))
                                                }}
                                              >
                                                Rename
                                              </button>
                                              {isOwner && (
                                                <button
                                                  className={styles.menuItem}
                                                  onClick={() => {
                                                    setDeleteConfirm({
                                                      type: 'file',
                                                      moduleId: module.id,
                                                      subfolder,
                                                      path: file.path,
                                                      filename: file.name,
                                                    })
                                                  }}
                                                >
                                                  Delete
                                                </button>
                                              )}
                                            </Popover.Content>
                                          </Popover.Portal>
                                        </Popover.Root>
                                      )}
                                    </div>
                                  )
                                })
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
                  {deleteConfirm.type === 'module'
                    ? 'Delete subject?'
                    : deleteConfirm.type === 'file'
                    ? 'Delete file?'
                    : 'Delete folder?'}
                </span>
              </div>
              <p className={styles.confirmMessage}>
                {deleteConfirm.type === 'module'
                  ? `Delete ${deleteConfirm.moduleId}? Its notes are permanently removed from the database. The subject definition is removed on the next deploy.`
                  : deleteConfirm.type === 'file'
                  ? `Delete ${deleteConfirm.filename}? This permanently removes the note. This can't be undone.`
                  : `Delete this folder? Every note inside it is permanently removed.`}
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
                  onClick={async () => {
                    const { type, moduleId, subfolder, path } = deleteConfirm
                    setDeleteConfirm(null)
                    if (type === 'module') {
                      onDeleteModule(moduleId)
                    } else if (type === 'file') {
                      await onDeleteFile(moduleId, path)
                    } else {
                      onDeleteSubfolder(moduleId, subfolder)
                    }
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
