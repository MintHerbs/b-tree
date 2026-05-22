import { useRef, useEffect, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Popover from '@radix-ui/react-popover'
import { colors } from '../../constants/colors'
import {
  Folder,
  FolderOpen,
  Eye,
  CloudArrowUp,
  Users,
  UserCircle,
  SignOut,
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  Image,
  CaretDown,
  FilePlus,
  DotsThreeVertical
} from '@phosphor-icons/react'
import StyleDropdown from './StyleDropdown'
import styles from './EditorNavbar.module.css'

export default function EditorNavbar({
  title,
  onTitleChange,
  unsaved,
  onToggleDirectory,
  directoryOpen,
  onPreview,
  onSave,
  saving,
  onToggleUsers,
  isOwner,
  username,
  onSignOut,
  editorRef,
  onFormatAction,
  onInsertImage,
  currentStyle,
  onStyleChange,
  onNewModule,
  iconOptions = [],
  onDeleteModule
}) {
  const [titleWidth, setTitleWidth] = useState('auto')
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleIcon, setNewModuleIcon] = useState(iconOptions[0]?.name || '')
  const [newModuleOpen, setNewModuleOpen] = useState(false)
  const mirrorRef = useRef(null)

  // Auto-size title input
  useEffect(() => {
    if (mirrorRef.current) {
      setTitleWidth(`${mirrorRef.current.offsetWidth + 20}px`)
    }
  }, [title])

  useEffect(() => {
    if (!iconOptions.some(option => option.name === newModuleIcon)) {
      setNewModuleIcon(iconOptions[0]?.name || '')
    }
  }, [iconOptions, newModuleIcon])

  return (
    <Tooltip.Provider delayDuration={300}>
      {/* Row 1: Document Controls */}
      <div className={styles.row1}>
        <div className={styles.leftGroup}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.iconButton}
                onClick={onToggleDirectory}
                style={{ color: directoryOpen ? colors.accent : colors.text }}
              >
                {directoryOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                {directoryOpen ? 'Close directory' : 'Open directory'}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <div className={styles.titleGroup}>
            <span ref={mirrorRef} className={styles.titleMirror}>
              {title || 'Untitled'}
            </span>
            <input
              type="text"
              className={styles.titleInput}
              placeholder="Untitled"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              style={{ width: titleWidth }}
            />
            {unsaved && <div className={styles.unsavedDot} />}
          </div>
        </div>

        <div className={styles.rightGroup}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className={styles.iconButton} onClick={onPreview}>
                <Eye size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Preview
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.iconButton}
                onClick={onSave}
                disabled={saving}
              >
                <CloudArrowUp
                  size={18}
                  className={saving ? styles.spinning : ''}
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Save to GitHub
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {isOwner && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className={styles.iconButton} onClick={onToggleUsers}>
                  <Users size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                  Manage users
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}

          <Popover.Root>
            <Popover.Trigger asChild>
              <button className={styles.iconButton}>
                <UserCircle size={18} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className={styles.popoverContent} sideOffset={5}>
                <div className={styles.userInfo}>
                  <span className={styles.username}>{username}</span>
                  <span className={styles.role}>{isOwner ? 'Owner' : 'Contributor'}</span>
                </div>
                <div className={styles.divider} />
                <button className={styles.menuItem} onClick={onSignOut}>
                  <SignOut size={16} />
                  <span>Sign out</span>
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>

      {/* Row 2: Formatting Toolbar */}
      <div className={styles.row2}>
        <div className={styles.formattingGroup}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.formatButton}
                onClick={() => onFormatAction('bold')}
              >
                <TextB size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Bold (⌘B)
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.formatButton}
                onClick={() => onFormatAction('italic')}
              >
                <TextItalic size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Italic (⌘I)
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.formatButton}
                onClick={() => onFormatAction('strike')}
              >
                <TextStrikethrough size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Strikethrough
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className={styles.formatButton}
                onClick={() => onFormatAction('code')}
              >
                <Code size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Code block
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className={styles.formatButton} onClick={onInsertImage}>
                <Image size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                Insert image
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <div className={styles.verticalDivider} />

          <StyleDropdown
            currentStyle={currentStyle}
            onStyleChange={onStyleChange}
          />
        </div>

        {isOwner && (
          <div className={styles.moduleGroup}>
            <div className={styles.verticalDivider} />

            <Popover.Root open={newModuleOpen} onOpenChange={setNewModuleOpen}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Popover.Trigger asChild>
                    <button className={styles.formatButton}>
                      <FilePlus size={18} />
                    </button>
                  </Popover.Trigger>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                    New subject
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Popover.Portal>
                <Popover.Content className={styles.popoverContent} sideOffset={5}>
                  <form
                    className={styles.newModuleForm}
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!newModuleName.trim()) return
                      onNewModule?.(newModuleName.trim(), newModuleIcon)
                      setNewModuleName('')
                      setNewModuleOpen(false)
                    }}
                  >
                    <input
                      className={styles.newModuleInput}
                      value={newModuleName}
                      onChange={(event) => setNewModuleName(event.target.value)}
                      placeholder="Subject name"
                      autoFocus
                    />
                    {iconOptions.length > 0 && (
                      <div className={styles.iconPicker} aria-label="Choose subject icon">
                        {iconOptions.map(option => (
                          <button
                            key={option.name}
                            type="button"
                            className={`${styles.iconChoice} ${newModuleIcon === option.name ? styles.selectedIconChoice : ''}`}
                            onClick={() => setNewModuleIcon(option.name)}
                            title={option.label}
                          >
                            <option.Icon size={18} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button className={styles.newModuleSubmit} type="submit">
                      Create
                    </button>
                  </form>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={styles.formatButton} title="Module actions">
                  <DotsThreeVertical size={18} />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className={styles.popoverContent} sideOffset={5}>
                  <button className={styles.menuItem} onClick={onDeleteModule}>
                    Delete selected module
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        )}
      </div>
    </Tooltip.Provider>
  )
}
