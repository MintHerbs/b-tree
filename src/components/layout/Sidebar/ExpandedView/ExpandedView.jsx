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
            {MODULES.filter(module => module.id !== 'Miscellaneous').map((module) => {
              const notes = module.notes ?? []
              const tools = module.tools ?? []
              const folders = module.folders ?? []
              const hasNotesFolder = Object.prototype.hasOwnProperty.call(module, 'notes')
              const hasToolsFolder = Object.prototype.hasOwnProperty.call(module, 'tools')
              const hasFolders = folders.length > 0
              const populated = moduleHasContent(module) || hasFolders

              return (
                <FolderItem key={module.id} value={module.id}>
                  <FolderTrigger variant="parent">
                    <module.Icon size={15} weight="regular" style={{ marginRight: 6, flexShrink: 0 }} />
                    {module.label}
                  </FolderTrigger>
                  <FolderContent>
                    <SubFiles>
                      {hasFolders && folders.map((folder) => (
                        <FolderItem key={`${module.id}-${folder.name}`} value={`${module.id}-${folder.name}`}>
                          <FolderTrigger variant="folder">{folder.name}</FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {folder.items.length > 0 ? folder.items.map((item) => {
                                const route = noteRoute(module.id, item.filename)
                                return (
                                  <FileItem
                                    key={item.filename}
                                    onClick={() => go(route, 'notes')}
                                    className={path === route ? styles.activeFile : undefined}
                                  >
                                    {item.label}
                                  </FileItem>
                                )
                              }) : (
                                <div className={styles.emptyState}>(empty)</div>
                              )}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      ))}

                      {hasNotesFolder && (
                        <FolderItem value={`${module.id}-notes`}>
                          <FolderTrigger variant="folder">notes</FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {notes.length > 0 ? notes.map((n) => {
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
                      )}

                      {hasToolsFolder && (
                        <FolderItem value={`${module.id}-tools`}>
                          <FolderTrigger variant="folder">tools</FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {tools.length > 0 ? tools.map((t) => (
                                <FileItem
                                  key={t.id}
                                  onClick={() => go(t.route, t.id)}
                                  className={path === t.route ? styles.activeFile : undefined}
                                >
                                  {t.label}
                                </FileItem>
                              )) : (
                                <div className={styles.emptyState}>(empty)</div>
                              )}
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
