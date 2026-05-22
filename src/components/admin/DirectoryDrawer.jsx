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
  Warning
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
  onMoveFile,
  isLoading = false
}) {
  const [newSubfolderModule, setNewSubfolderModule] = useState(null)
  const [newSubfolderValue, setNewSubfolderValue] = useState('')
  const [renamingPath, setRenamingPath] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [addingNewModule, setAddingNewModule] = useState(false)
  const [newModuleValue, setNewModuleValue] = useState('')
  const [dragOverPath, setDragOverPath] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
      onNewModule(newModuleValue.trim())
      setAddingNewModule(false)
      setNewModuleValue('')
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
          <h2 className={styles.title}>Files</h2>
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
                    <FolderTrigger>
                      {module.label}
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
                                  setDeleteConfirm({ type: 'module', moduleId: module.id })
                                }}
                              >
                                Delete module
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

                      return (
                        <div
                          key={subfolder}
                          className={`${styles.subfolderRow} ${
                            isSelected(module.id, subfolder) ? styles.selected : ''
                          } ${isDragOver(module.id, subfolder) ? styles.dragOver : ''}`}
                          onClick={() => !isRenaming && onSelectPath({ moduleId: module.id, subfolder })}
                          draggable={!isRenaming}
                          onDragStart={(e) => handleDragStart(e, module.id, subfolder)}
                          onDragOver={(e) => handleDragOver(e, module.id, subfolder)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, module.id, subfolder)}
                        >
                          <div className={styles.subfolderContent}>
                            <File size={14} className={styles.fileIcon} />
                            
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
              New Module
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
                  {deleteConfirm.type === 'module' ? 'Delete module?' : 'Delete folder?'}
                </span>
              </div>
              <p className={styles.confirmMessage}>
                {deleteConfirm.type === 'module'
                  ? `Delete ${deleteConfirm.moduleId}? All notes inside will be removed from modules.js.`
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
