/**
 * SidebarFileTree — Renders the animate-ui Files tree when sidebar is expanded.
 * Matches the file structure from SIDEBAR_REDESIGN_SPEC.md section 2.
 */
import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderContent,
  FileItem,
  SubFiles,
} from '../../effects/animate-ui/components/radix/files'
import styles from './SidebarFileTree.module.css'

function SidebarFileTree({ onFileClick }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive active module from current path
  const activeModule = useMemo(() => {
    const path = location.pathname
    if (path === '/tree' || path === '/erd') return 'database'
    if (path.startsWith('/algo')) return 'algorithms'
    if (path.startsWith('/logic')) return 'logic'
    return null
  }, [location.pathname])

  const showComingSoonToast = () => {
    alert('Coming soon')
  }

  return (
    <div className={styles.fileTree}>
      <Files defaultOpen={activeModule ? [activeModule] : []}>
        {/* Database Module */}
        <FolderItem value="database">
          <FolderTrigger>database</FolderTrigger>
          <FolderContent>
            <SubFiles>
              <FolderItem value="db-notes">
                <FolderTrigger>notes</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    <FileItem onClick={() => onFileClick('db-notes-test')}>
                      test.md
                    </FileItem>
                  </SubFiles>
                </FolderContent>
              </FolderItem>
              <FolderItem value="db-tools">
                <FolderTrigger>tools</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    <FileItem onClick={() => navigate('/tree')}>
                      B+ Tree Visualizer
                    </FileItem>
                    <FileItem onClick={() => navigate('/erd')}>
                      ER Diagram Builder
                    </FileItem>
                  </SubFiles>
                </FolderContent>
              </FolderItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* Algorithms Module */}
        <FolderItem value="algorithms">
          <FolderTrigger>algorithms</FolderTrigger>
          <FolderContent>
            <SubFiles>
              <FolderItem value="algo-tools">
                <FolderTrigger>tools</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    <FileItem onClick={() => navigate('/algo/complexity')}>
                      O Complexity
                    </FileItem>
                    <FileItem onClick={() => navigate('/algo/recurrence')}>
                      Recurrence Relation
                    </FileItem>
                  </SubFiles>
                </FolderContent>
              </FolderItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* Logic Module */}
        <FolderItem value="logic">
          <FolderTrigger>logic</FolderTrigger>
          <FolderContent>
            <SubFiles>
              <FolderItem value="logic-tools">
                <FolderTrigger>tools</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    <FileItem onClick={() => navigate('/logic/proof')}>
                      Logical Equivalence
                    </FileItem>
                    <FileItem onClick={() => navigate('/logic/tableaux')}>
                      Semantic Tableaux
                    </FileItem>
                  </SubFiles>
                </FolderContent>
              </FolderItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* Computational Math Module */}
        <FolderItem value="computational-math">
          <FolderTrigger>computational-math</FolderTrigger>
          <FolderContent>
            <SubFiles>
              <FileItem onClick={() => showComingSoonToast()}>
                (coming soon)
              </FileItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* Operating System Module */}
        <FolderItem value="operating-system">
          <FolderTrigger>operating-system</FolderTrigger>
          <FolderContent>
            <SubFiles>
              <FileItem onClick={() => showComingSoonToast()}>
                (coming soon)
              </FileItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* Easter Egg: package.json */}
        <FileItem onClick={() => onFileClick('package-json')}>
          package.json
        </FileItem>
      </Files>
    </div>
  )
}

export default SidebarFileTree
