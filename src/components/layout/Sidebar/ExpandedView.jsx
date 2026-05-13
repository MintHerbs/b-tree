import {
  FileItem,
  Files,
  FolderContent,
  FolderItem,
  FolderTrigger,
  SubFiles,
} from '@/components/animate-ui/components/radix/files'
import PackageJsonPopup from './PackageJsonPopup'
import styles from './ExpandedView.module.css'
import { MODULES, STANDALONE_TOOLS, PACKAGE_JSON, findActiveModule } from './modules'

function ExpandedView({
  path,
  go,
  isPackageJsonOpen,
  onOpenPackageJson,
  onClosePackageJson,
  mode,
  setMode,
  sessionId,
  unreadCount = 0,
}) {
  const activeModule = findActiveModule(path) ?? MODULES.find((m) => m.id === 'database')
  const hasContent = activeModule && (activeModule.notes.length > 0 || activeModule.tools.length > 0)

  return (
    <div className={styles.container}>
      <div className={styles.rootLabel}>
        {activeModule ? activeModule.label : 'App / Computer Science'}
      </div>

      <div className={styles.treeArea}>
        <div className={styles.filesContainer}>
          {activeModule && hasContent && (
            <Files defaultOpen={[`${activeModule.id}-notes`, `${activeModule.id}-tools`]}>
              <FolderItem value={`${activeModule.id}-notes`}>
                <FolderTrigger>notes</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    {activeModule.notes.map((n) => (
                      <FileItem key={n.route} onClick={() => go(n.route, n.childId)}>
                        {n.label}
                      </FileItem>
                    ))}
                  </SubFiles>
                </FolderContent>
              </FolderItem>

              <FolderItem value={`${activeModule.id}-tools`}>
                <FolderTrigger>tools</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    {activeModule.tools.map((t) => (
                      <FileItem
                        key={t.route}
                        onClick={() => go(t.route, t.childId)}
                        className={path === t.route ? styles.activeFile : undefined}
                      >
                        {t.label}
                      </FileItem>
                    ))}
                  </SubFiles>
                </FolderContent>
              </FolderItem>
            </Files>
          )}

          {activeModule && !hasContent && (
            <div className={styles.emptyState}>
              {activeModule.label} — coming soon
            </div>
          )}

          <div className={styles.standaloneSection}>
            <FileItem icon={PACKAGE_JSON.Icon} onClick={() => onOpenPackageJson?.()}>
              {PACKAGE_JSON.label}
            </FileItem>
            {STANDALONE_TOOLS.map((t) => (
              <FileItem
                key={t.id}
                icon={t.Icon}
                variant="tool"
                onClick={() => go(t.route, t.childId)}
                className={path === t.route ? styles.activeFile : undefined}
              >
                {t.label}
              </FileItem>
            ))}
          </div>
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
