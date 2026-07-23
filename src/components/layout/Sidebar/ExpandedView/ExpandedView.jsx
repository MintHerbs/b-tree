import {
  FileItem,
  Files,
  FolderContent,
  FolderItem,
  FolderTrigger,
  SubFiles,
} from '@/components/animate-ui/components/radix/files'
import PackageJsonPopup from '../PackageJsonPopup/PackageJsonPopup'
import styles from './ExpandedView.module.css'
import {
  STANDALONE_TOOLS,
  PACKAGE_JSON,
  findActiveModule,
  noteRoute,
} from '../modules'
import { displaySubfolder } from '../../../../lib/notesApi'
import { useNotesRegistry } from '../../../../hooks/useNotesRegistry'

function ExpandedView({
  path,
  go,
  isPackageJsonOpen,
  onOpenPackageJson,
  onClosePackageJson,
  mode,
  setMode,
  sessionId,
  unreadCount,
}) {
  const { modules } = useNotesRegistry()
  const activeModule = findActiveModule(path)
  const defaultOpen = activeModule ? [activeModule.id] : []

  return (
    <div className={styles.container}>
      <div className={styles.rootLabel}>
        <span
          onClick={() => go('/home', 'Home')}
          style={{ cursor: 'pointer', textDecoration: 'none' }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          home
        </span>
        /computer science
      </div>

      <div className={styles.treeArea}>
        <div className={styles.filesContainer}>
          <Files defaultOpen={defaultOpen}>
            {modules.filter(module => module.id !== 'Miscellaneous').map((module) => {
              const notes = module.notes ?? []
              const tools = module.tools ?? []

              // Group notes by their display subfolder (first path segment;
              // root-level notes fall under "notes"), matching DirectoryDrawer.
              // Empty subfolders come from module.subfolders (note_folders).
              const bySubfolder = new Map()
              for (const n of notes) {
                const sub = displaySubfolder(n.filename)
                if (!bySubfolder.has(sub)) bySubfolder.set(sub, [])
                bySubfolder.get(sub).push(n)
              }
              for (const name of (module.subfolders ?? [])) {
                if (!bySubfolder.has(name)) bySubfolder.set(name, [])
              }
              const subfolders = [...bySubfolder.keys()].sort()
              const populated = subfolders.length > 0 || tools.length > 0

              return (
                <FolderItem key={module.id} value={module.id}>
                  <FolderTrigger variant="parent">
                    <module.Icon size={15} weight="regular" style={{ marginRight: 6, flexShrink: 0 }} />
                    {module.label}
                  </FolderTrigger>
                  <FolderContent>
                    <SubFiles>
                      {subfolders.map((sub) => {
                        const items = bySubfolder.get(sub)
                        return (
                          <FolderItem key={`${module.id}-${sub}`} value={`${module.id}-${sub}`}>
                            <FolderTrigger variant="folder">{sub}</FolderTrigger>
                            <FolderContent>
                              <SubFiles>
                                {items.length > 0 ? items.map((n) => {
                                  const route = noteRoute(module.id, n.filename)
                                  return (
                                    <FileItem
                                      key={n.filename}
                                      onClick={() => go(route, 'notes')}
                                      className={path === route ? styles.activeFile : undefined}
                                    >
                                      {n.label}
                                    </FileItem>
                                  )
                                }) : (
                                  <div className={styles.emptyState}>(empty)</div>
                                )}
                              </SubFiles>
                            </FolderContent>
                          </FolderItem>
                        )
                      })}

                      {tools.length > 0 && (
                        <FolderItem value={`${module.id}-tools`}>
                          <FolderTrigger variant="folder">tools</FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {tools.map((t) => (
                                <FileItem
                                  key={t.id}
                                  onClick={() => go(t.route, t.id)}
                                  className={path === t.route ? styles.activeFile : undefined}
                                >
                                  {t.label}
                                </FileItem>
                              ))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {!populated && (
                        <div className={styles.emptyState}>(coming soon)</div>
                      )}
                    </SubFiles>
                  </FolderContent>
                </FolderItem>
              )
            })}

            <FileItem icon={PACKAGE_JSON.Icon} onClick={() => onOpenPackageJson?.()}>
              {PACKAGE_JSON.label}
            </FileItem>
            {STANDALONE_TOOLS.filter(t => t.id !== 'Home').map((t) => (
              <FileItem
                key={t.id}
                icon={t.Icon}
                onClick={() => go(t.route, t.id)}
                className={path === t.route ? styles.activeFile : undefined}
              >
                {t.label}
              </FileItem>
            ))}
          </Files>
        </div>
      </div>

      <PackageJsonPopup
        isOpen={isPackageJsonOpen}
        onClose={onClosePackageJson}
        mode={mode}
        setMode={setMode}
        sessionId={sessionId}
        unreadCount={unreadCount}
      />
    </div>
  )
}

export default ExpandedView
