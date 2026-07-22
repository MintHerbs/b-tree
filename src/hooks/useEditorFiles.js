import { getFileContent } from '../lib/githubApi'

export function useEditorFiles({ showToast, setContent, setTitle, setUnsaved, setDirectoryOpen, setSelectedPath, setOriginalPath, restoreDraftIfExists }) {
  const handleLoadFile = async (filePath) => {
    try {
      showToast('Loading file...', 'success')
      const fileContent = await getFileContent(filePath)

      // Extract filename without extension for title
      const fileName = filePath.split('/').pop().replace('.md', '')

      setContent(fileContent)
      setTitle(fileName)
      setUnsaved(false)
      setDirectoryOpen(false)
      setOriginalPath(filePath)

      // Extract module and subfolder from path
      // Path format: src/content/notes/{moduleId}/{subfolder}/{filename}
      const pathParts = filePath.split('/')
      let moduleId, subfolder
      if (pathParts.length >= 5) {
        moduleId = pathParts[3]
        subfolder = pathParts[4]
        setSelectedPath({ moduleId, subfolder })
      }

      showToast(`Loaded ${fileName}`, 'success')

      // Prefer an unsaved draft over the just-loaded published content, if one exists
      if (moduleId && subfolder) {
        await restoreDraftIfExists?.({ moduleId, subfolder, filename: fileName })
      }
    } catch (error) {
      showToast(`Failed to load file: ${error.message}`, 'error')
    }
  }

  return { handleLoadFile }
}
