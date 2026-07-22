import { useState, useRef } from 'react'
import { MODULES } from '../components/layout/Sidebar/modules'

export function useEditorState() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unsaved, setUnsaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [formulaModalOpen, setFormulaModalOpen] = useState(false)
  const [socialLinkModalOpen, setSocialLinkModalOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState(null) // { moduleId, subfolder }
  const [originalPath, setOriginalPath] = useState(null) // GitHub path the loaded note came from, or null for a new note
  const [modules, setModules] = useState(MODULES)
  const [modulesLoading, setModulesLoading] = useState(true)
  const [currentStyle, setCurrentStyle] = useState('body')
  const [isTooNarrow, setIsTooNarrow] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  ))

  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  return {
    title, setTitle,
    content, setContent,
    unsaved, setUnsaved,
    saving, setSaving,
    directoryOpen, setDirectoryOpen,
    previewOpen, setPreviewOpen,
    usersOpen, setUsersOpen,
    changePasswordOpen, setChangePasswordOpen,
    formulaModalOpen, setFormulaModalOpen,
    socialLinkModalOpen, setSocialLinkModalOpen,
    selectedPath, setSelectedPath,
    originalPath, setOriginalPath,
    modules, setModules,
    modulesLoading, setModulesLoading,
    currentStyle, setCurrentStyle,
    isTooNarrow, setIsTooNarrow,
    editorRef,
    fileInputRef,
  }
}
