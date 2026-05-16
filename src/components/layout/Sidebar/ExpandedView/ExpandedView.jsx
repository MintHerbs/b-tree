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
  MODULES,
  STANDALONE_TOOLS,
  PACKAGE_JSON,
  findActiveModule,
  hasContent as moduleHasContent,
  noteRoute,
} from '../modules'

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
  const activeModule = findActiveModule(path)

  const defaultOpen = activeModule
    ? [activeModule.id, `${activeModule.id}-notes`, `${activeModule.id}-tools`]
    : []

  return (
    <div className={styles.container}>
      <div className={styles.rootLabel}>Computer Science</div>

      <div className={styles.treeArea}>
        <div className={styles.filesContainer}>
          <Files defaultOpen={defaultOpen}>
            {MODULES.map((module) => {
              const notes = module.notes ?? []
              const tools = module.tools ?? []
              const populated = moduleHasContent(module)

              return (
                <FolderItem key={module.id} value={module.id}>
                  <FolderTrigger variant="parent">{module.id}</FolderTrigger>
                  <FolderContent>
                    <SubFiles>
                      {notes.length > 0 && (
                        <FolderItem value={`${module.id}-notes`}>
                          <FolderTrigger variant="folder">notes</FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {notes.map((n) => {
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
                              })}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

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
            {STANDALONE_TOOLS.filter(t => t.id === 'Home').map((t) => (
              <FileItem
                key={t.id}
                icon={t.Icon}
                onClick={() => go(t.route, t.id)}
                className={path === t.route ? styles.activeFile : undefined}
              >
                {t.label}
              </FileItem>
            ))}
            {STANDALONE_TOOLS.filter(t => t.id !== 'Home').map((t) => (
              <FileItem
                key={t.id}
                icon={t.Icon}
                variant="tool"
                onClick={() => go(t.route, t.id)}
                className={
                  path === t.route
                    ? styles.activeFile
                    : (t.id === 'cpa' || t.id === 'minmax')
                    ? styles.cpaFile
                    : undefined
                }
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
