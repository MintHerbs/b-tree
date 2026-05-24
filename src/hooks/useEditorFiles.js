import { getFileContent } from '../lib/githubApi'

export function useEditorFiles({ showToast, setContent, setTitle, setUnsaved, setDirectoryOpen, setSelectedPath }) {
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

      // Extract module and subfolder from path
      // Path format: src/content/notes/{moduleId}/{subfolder}/{filename}
      const pathParts = filePath.split('/')
      if (pathParts.length >= 5) {
        const moduleId = pathParts[3]
        const subfolder = pathParts[4]
        setSelectedPath({ moduleId, subfolder })
      }

      showToast(`Loaded ${fileName}`, 'success')
    } catch (error) {
      showToast(`Failed to load file: ${error.message}`, 'error')
    }
  }

  return { handleLoadFile }
}
