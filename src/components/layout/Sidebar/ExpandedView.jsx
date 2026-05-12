import {
  Brain,
  Calculator,
  ChartLineUp,
  Code,
  Cpu,
  Database,
  Eye,
  FileCode as FileJson,
  Function as FunctionIcon,
  HardDrive,
  Network,
  ShieldCheck,
  Sparkle,
  TerminalWindow,
} from '@phosphor-icons/react'
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

function ExpandedView({
  defaultOpen = [],
  go,
  isPackageJsonOpen,
  onOpenPackageJson,
  onClosePackageJson,
  mode,
  setMode,
  sessionId,
  unreadCount = 0,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.rootLabel}>App / Computer Science</div>

      <div className={styles.treeArea}>
        <div className={styles.filesContainer}>
          <Files defaultOpen={defaultOpen}>
            <FolderItem value="algorithms">
              <FolderTrigger variant="parent" icon={<ChartLineUp size={16} weight="regular" />}>
                Algorithms
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="algorithms-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="algorithms-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles>
                        <FileItem onClick={() => go('/algo/code-complexity', 'complexity')}>
                          Code Complexity.js
                        </FileItem>
                        <FileItem onClick={() => go('/algo/recurrence-relation', 'recurrence')}>
                          Recurrence Relation.js
                        </FileItem>
                      </SubFiles>
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="artificial-intelligence">
              <FolderTrigger variant="parent" icon={<Brain size={16} weight="regular" />}>
                Artificial Intelligence
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="ai-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="ai-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles>
                        <FileItem onClick={() => go('/logic/truth-tree', 'truth-tree')}>
                          Truth Tree.js
                        </FileItem>
                        <FileItem onClick={() => go('/logic/semantic-tableaux', 'semantic-tableaux')}>
                          Semantic Tableaux.js
                        </FileItem>
                      </SubFiles>
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="computational-math">
              <FolderTrigger variant="parent" icon={<FunctionIcon size={16} weight="regular" />}>
                Computational Math
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="computational-math-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="computational-math-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="computer-architecture">
              <FolderTrigger variant="parent" icon={<Cpu size={16} weight="regular" />}>
                Computer Architecture
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="computer-architecture-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="computer-architecture-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="computer-networking">
              <FolderTrigger variant="parent" icon={<Network size={16} weight="regular" />}>
                Computer Networking
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="computer-networking-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="computer-networking-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="computer-security">
              <FolderTrigger variant="parent" icon={<ShieldCheck size={16} weight="regular" />}>
                Computer Security
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="computer-security-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="computer-security-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="computer-vision">
              <FolderTrigger variant="parent" icon={<Eye size={16} weight="regular" />}>
                Computer Vision
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="computer-vision-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="computer-vision-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="database">
              <FolderTrigger variant="parent" icon={<Database size={16} weight="regular" />}>
                Database
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="database-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles>
                        <FileItem onClick={() => go('/notes/database/getting-started.md', 'notes')}>
                          getting-started.md
                        </FileItem>
                      </SubFiles>
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="database-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles>
                        <FileItem onClick={() => go('/tree', 'btree')}>
                          B+ Tree.js
                        </FileItem>
                        <FileItem onClick={() => go('/erd', 'erd')}>
                          ERD Visualizer.js
                        </FileItem>
                      </SubFiles>
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="operating-systems">
              <FolderTrigger variant="parent" icon={<HardDrive size={16} weight="regular" />}>
                Operating Systems
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="operating-systems-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="operating-systems-lab">
                    <FolderTrigger>lab</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="programming">
              <FolderTrigger variant="parent" icon={<TerminalWindow size={16} weight="regular" />}>
                Programming
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="programming-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="programming-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FolderItem value="software-engineering">
              <FolderTrigger variant="parent" icon={<Code size={16} weight="regular" />}>
                Software Engineering
              </FolderTrigger>
              <FolderContent>
                <SubFiles>
                  <FolderItem value="software-engineering-notes">
                    <FolderTrigger>notes</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                  <FolderItem value="software-engineering-tools">
                    <FolderTrigger>tools</FolderTrigger>
                    <FolderContent>
                      <SubFiles />
                    </FolderContent>
                  </FolderItem>
                </SubFiles>
              </FolderContent>
            </FolderItem>

            <FileItem icon={FileJson} onClick={() => onOpenPackageJson?.()}>
              package.json
            </FileItem>
            <FileItem
              icon={Calculator}
              variant="tool"
              onClick={() => go('/tools/cpa-calculator', 'cpa')}
            >
              CPA Calculator.js
            </FileItem>
            <FileItem
              icon={Sparkle}
              variant="tool"
              onClick={() => go('/tools/lazy-grades', 'minmax')}
            >
              Min Effort Max Result.js
            </FileItem>
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
