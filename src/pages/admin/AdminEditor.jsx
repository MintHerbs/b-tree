import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import '../../styles/adminTokens.css'
import { useAdmin } from './useAdmin'
import EditorNavbar from '../../components/admin/EditorNavbar'
import DirectoryDrawer from '../../components/admin/DirectoryDrawer'
import PreviewModal from '../../components/admin/PreviewModal'
import UsersDrawer from '../../components/admin/UsersDrawer'
import ImageCleanupDrawer from '../../components/admin/ImageCleanupDrawer'
import CourseManagementDrawer from '../../components/admin/CourseManagementDrawer'
import ChangePasswordModal from '../../components/admin/ChangePasswordModal'
import FormulaModal from '../../components/admin/FormulaModal'
import SocialLinkModal from '../../components/admin/SocialLinkModal'
import ToastNotification, { useToast } from '../../components/admin/ToastNotification'
import { Monitor } from '@phosphor-icons/react'
import styles from './AdminEditor.module.css'
import { useEditorState } from '../../hooks/useEditorState'
import { useEditorSave } from '../../hooks/useEditorSave'
import { useEditorImages } from '../../hooks/useEditorImages'
import { useEditorModules } from '../../hooks/useEditorModules'
import { useEditorFormatting } from '../../hooks/useEditorFormatting'
import { useEditorFiles } from '../../hooks/useEditorFiles'
import { useCourses } from '../../hooks/useCourses'

function AdminEditorContent() {
  const location = useLocation()
  const { user, profile, loading } = useAdmin()
  const { showToast } = useToast()
  const {
    title, setTitle, content, setContent, unsaved, setUnsaved, saving, setSaving, justPublished, setJustPublished,
    directoryOpen, setDirectoryOpen, previewOpen, usersOpen, changePasswordOpen, formulaModalOpen, socialLinkModalOpen,
    cleanupOpen, courseManagementOpen, selectedPath, setSelectedPath, modules, setModules, modulesLoading, currentStyle, setCurrentStyle,
    isTooNarrow, editorRef, fileInputRef, selectedCourse, setSelectedCourse, courses, setCourses, handleContentChange,
    closeDirectory, toggleDirectory, openPreview, closePreview, toggleUsers, closeUsers, toggleCleanup, closeCleanup,
    toggleCourseManagement, closeCourseManagement, openChangePassword, closeChangePassword, openFormulaModal, closeFormulaModal,
    openSocialLinkModal, closeSocialLinkModal, clickFileInput, clearEditor, restoreEditor, currentEditorState, handleSignOut,
  } = useEditorState({ loading, profile, locationSearch: location.search })
  const { courses: fetchedCourses, loading: coursesLoading } = useCourses({ isOwner: profile?.role === 'owner', userId: user?.id })
  useEffect(() => { if (!coursesLoading && fetchedCourses) setCourses(fetchedCourses) }, [fetchedCourses, coursesLoading])
  useEffect(() => {
    if (!profile || courses.length === 0) return
    if (profile.role === 'owner') { if (!selectedCourse) setSelectedCourse(courses[0]?.id ?? null) } else { setSelectedCourse(profile.course_id) }
  }, [profile, courses, selectedCourse])
  const { unusedIconOptions, visibleModules, allowedDirectories, isOwner, handleNewModule, handleDeleteModule, handleRenameModule, handleNewSubfolder, handleRenameSubfolder, handleDeleteSubfolder, handleMoveFile, handleDeleteSelectedModule } = useEditorModules({ showToast, setModules, setSelectedPath, modules, profile, selectedCourse, selectedPath })
  const { imageQueueRef, imageCountRef, handleFileInputChange, getRootProps, getInputProps, isDragActive, renderInlineImages, hideImageWidget } = useEditorImages({ selectedPath, showToast, editorRef, fileInputRef, setContent })
  const { handleSave } = useEditorSave({
    userId: user?.id, title, content, selectedPath, selectedCourse, showToast, setSaving, setUnsaved, setJustPublished, setTitle, setContent, setSelectedPath,
    imageQueueRef, imageCountRef,
  })
  const { handleBeforeMount, handleEditorMount, handleFormatAction, handleStyleChange, handleInsertFormula } = useEditorFormatting({ editorRef, setCurrentStyle, renderInlineImages, hideImageWidget })
  const { handleLoadFile } = useEditorFiles({ showToast, setContent, setTitle, setUnsaved, setDirectoryOpen, setSelectedPath })

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isModifierPressed = event.metaKey || event.ctrlKey
      if (!isModifierPressed) return

      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
        handleSave()
      } else if (key === 'b') {
        event.preventDefault()
        handleFormatAction('bold')
      } else if (key === 'i') {
        event.preventDefault()
        handleFormatAction('italic')
      } else if (event.shiftKey && key === 'p') {
        event.preventDefault()
        openPreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, handleFormatAction, openPreview])
  if (loading) return <div className={styles.loading}><div className={styles.loadingSpinner}>Loading...</div></div>
  if (isTooNarrow) return <div className={styles.responsiveGuard}><Monitor size={32} weight="regular" /><p>Admin panel requires a larger screen.</p></div>

  return (
    <div className={styles.adminEditor}>
      {/* Fixed overlays */}
      <DirectoryDrawer open={directoryOpen} onClose={closeDirectory} modules={visibleModules} allowedDirectories={allowedDirectories} selectedPath={selectedPath} onSelectPath={setSelectedPath} isOwner={isOwner} onNewSubfolder={handleNewSubfolder} onRenameSubfolder={handleRenameSubfolder} onDeleteSubfolder={handleDeleteSubfolder} onNewModule={handleNewModule} onDeleteModule={handleDeleteModule} onRenameModule={handleRenameModule} onLoadFile={handleLoadFile} currentEditorState={currentEditorState} onClearEditor={clearEditor} onRestoreEditor={restoreEditor} onMoveFile={handleMoveFile} isLoading={modulesLoading} iconOptions={unusedIconOptions} />

      <PreviewModal open={previewOpen} onClose={closePreview} title={title} content={content} />

      {profile?.role === 'owner' && <UsersDrawer open={usersOpen} onClose={closeUsers} currentUserId={user?.id} isOwner={isOwner} />}

      {profile?.role === 'owner' && <ImageCleanupDrawer open={cleanupOpen} onClose={closeCleanup} modules={modules} isOwner={isOwner} />}

      {profile?.role === 'owner' && <CourseManagementDrawer open={courseManagementOpen} onClose={closeCourseManagement} isOwner={isOwner} userId={user?.id} />}

      <ChangePasswordModal open={changePasswordOpen} onClose={closeChangePassword} />
      <FormulaModal open={formulaModalOpen} onClose={closeFormulaModal} onInsert={handleInsertFormula} />
      <SocialLinkModal open={socialLinkModalOpen} onClose={closeSocialLinkModal} onInsert={handleInsertFormula} />

      {/* Navbar Row 1 + Row 2 */}
      <EditorNavbar title={title} onTitleChange={setTitle} unsaved={unsaved} justPublished={justPublished} onToggleDirectory={toggleDirectory} directoryOpen={directoryOpen} onPreview={openPreview} onSave={handleSave} saving={saving} onToggleUsers={toggleUsers} onToggleCleanup={toggleCleanup} cleanupOpen={cleanupOpen} onToggleCourseManagement={toggleCourseManagement} courseManagementOpen={courseManagementOpen} isOwner={isOwner} username={profile?.username} onSignOut={handleSignOut} onChangePassword={openChangePassword} editorRef={editorRef} onFormatAction={handleFormatAction} onInsertImage={clickFileInput} onInsertFormula={openFormulaModal} onInsertSocialLink={openSocialLinkModal} currentStyle={currentStyle} onStyleChange={handleStyleChange} onNewModule={handleNewModule} iconOptions={unusedIconOptions} onDeleteModule={handleDeleteSelectedModule} selectedCourse={selectedCourse} onCourseChange={setSelectedCourse} courses={courses} />

      {/* Canvas */}
      <div className={styles.canvas} {...getRootProps()}>
        <input {...getInputProps()} />
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileInputChange} />
        <div className={styles.writingArea}>
          {content === '' && <div className={styles.emptyPlaceholder}>Start writing…</div>}
          <Editor
            height="100%"
            defaultLanguage="markdown"
            theme="mooner-dark"
            value={content}
            onChange={handleContentChange}
            onMount={handleEditorMount}
            beforeMount={handleBeforeMount}
            options={{ fontSize: 15, lineHeight: 28, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordWrap: 'on', minimap: { enabled: false }, lineNumbers: 'off', scrollBeyondLastLine: true, renderLineHighlight: 'none', overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: 'hidden', horizontal: 'hidden' }, padding: { top: 0, bottom: 120 } }}
          />
        </div>
        {isDragActive && <div className={styles.dropOverlay}><p>Drop images here...</p></div>}
      </div>
    </div>
  )
}

export default function AdminEditor() {
  return (
    <ToastNotification>
      <AdminEditorContent />
    </ToastNotification>
  )
}
