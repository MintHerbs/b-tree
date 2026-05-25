import { useEffect, useRef, useState } from 'react'
import { MODULES } from '../components/layout/Sidebar/modules'
import { supabase } from '../lib/supabaseClient'

export function useEditorState({ loading, profile, locationSearch } = {}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unsaved, setUnsaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [formulaModalOpen, setFormulaModalOpen] = useState(false)
  const [socialLinkModalOpen, setSocialLinkModalOpen] = useState(false)
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [courseManagementOpen, setCourseManagementOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState(null) // { moduleId, subfolder }
  const [modules, setModules] = useState(MODULES)
  const [modulesLoading, setModulesLoading] = useState(true)
  const [currentStyle, setCurrentStyle] = useState('body')
  const [isTooNarrow, setIsTooNarrow] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  ))
  
  // Course state
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courses, setCourses] = useState([])

  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsTooNarrow(window.innerWidth < 960)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (loading) return

    setModulesLoading(true)
    setModules(MODULES)

    const loadingTimer = window.setTimeout(() => {
      setModulesLoading(false)
    }, 250)

    return () => {
      window.clearTimeout(loadingTimer)
    }
  }, [loading])

  useEffect(() => {
    if (!loading && profile?.role === 'owner') {
      const params = new URLSearchParams(locationSearch)
      if (params.get('panel') === 'users') {
        setUsersOpen(true)
      }
    }
  }, [locationSearch, loading, profile])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!unsaved) return

      const message = 'You have unsaved changes. Leave anyway?'
      event.preventDefault()
      event.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [unsaved])

  const handleContentChange = (value) => {
    setContent(value || '')
    setUnsaved(true)
  }

  const closeDirectory = () => setDirectoryOpen(false)
  const toggleDirectory = () => setDirectoryOpen(!directoryOpen)

  const openPreview = () => setPreviewOpen(true)
  const closePreview = () => setPreviewOpen(false)

  const toggleUsers = () => setUsersOpen(!usersOpen)
  const closeUsers = () => setUsersOpen(false)

  const toggleCleanup = () => setCleanupOpen(o => !o)
  const closeCleanup = () => setCleanupOpen(false)

  const toggleCourseManagement = () => setCourseManagementOpen(o => !o)
  const closeCourseManagement = () => setCourseManagementOpen(false)

  const openChangePassword = () => setChangePasswordOpen(true)
  const closeChangePassword = () => setChangePasswordOpen(false)

  const openFormulaModal = () => setFormulaModalOpen(true)
  const closeFormulaModal = () => setFormulaModalOpen(false)

  const openSocialLinkModal = () => setSocialLinkModalOpen(true)
  const closeSocialLinkModal = () => setSocialLinkModalOpen(false)

  const clickFileInput = () => fileInputRef.current?.click()

  const clearEditor = () => {
    setContent('')
    setTitle('')
    setUnsaved(false)
    setSelectedPath(null)
  }

  const restoreEditor = (state) => {
    setContent(state.content)
    setTitle(state.title)
    setUnsaved(state.unsaved)
    setSelectedPath(state.selectedPath)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin'
  }

  return {
    title, setTitle,
    content, setContent,
    unsaved, setUnsaved,
    saving, setSaving,
    justPublished, setJustPublished,
    directoryOpen, setDirectoryOpen,
    previewOpen, setPreviewOpen,
    usersOpen, setUsersOpen,
    changePasswordOpen, setChangePasswordOpen,
    formulaModalOpen, setFormulaModalOpen,
    socialLinkModalOpen, setSocialLinkModalOpen,
    cleanupOpen, setCleanupOpen,
    courseManagementOpen, setCourseManagementOpen,
    selectedPath, setSelectedPath,
    modules, setModules,
    modulesLoading, setModulesLoading,
    currentStyle, setCurrentStyle,
    isTooNarrow, setIsTooNarrow,
    selectedCourse, setSelectedCourse,
    courses, setCourses,
    editorRef,
    fileInputRef,
    handleContentChange,
    closeDirectory,
    toggleDirectory,
    openPreview,
    closePreview,
    toggleUsers,
    closeUsers,
    toggleCleanup,
    closeCleanup,
    toggleCourseManagement,
    closeCourseManagement,
    openChangePassword,
    closeChangePassword,
    openFormulaModal,
    closeFormulaModal,
    openSocialLinkModal,
    closeSocialLinkModal,
    clickFileInput,
    clearEditor,
    restoreEditor,
    currentEditorState: {
      content,
      title,
      unsaved,
      selectedPath,
    },
    handleSignOut,
  }
}
