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
  onDeleteModule
}) {
  const [titleWidth, setTitleWidth] = useState('auto')
  const mirrorRef = useRef(null)

  // Auto-size title input
  useEffect(() => {
    if (mirrorRef.current) {
      setTitleWidth(`${mirrorRef.current.offsetWidth + 20}px`)
    }
  }, [title])

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

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className={styles.formatButton} onClick={() => onNewModule && onNewModule('New Module')}>
                  <FilePlus size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                  New module
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

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
