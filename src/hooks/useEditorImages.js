import { useRef } from 'react'

export function useEditorImages({ selectedPath, showToast, editorRef, setContent }) {
  const imageCountRef = useRef({})
  const imageQueueRef = useRef({}) // shape: { 'draft://img-1.png': { file: File, ext: string } }

  // Image upload handler
  const handleImageUpload = async (file) => {
    if (!selectedPath) {
      showToast('Please select a directory first', 'error')
      return
    }

    try {
      // Generate draft key
      const ext = file.name.split('.').pop()
      const draftKey = `draft-img-${Date.now()}.${ext}`

      // Store file in queue
      imageQueueRef.current[draftKey] = { file, ext }

      // Insert draft markdown at cursor
      const imageMarkdown = `![image](draft://${draftKey})`

      if (editorRef.current) {
        const editor = editorRef.current

        // Check if this is a replacement operation
        if (editor._imageReplacePosition) {
          const { startPos, endPos } = editor._imageReplacePosition
          const range = {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          }
          editor.executeEdits('', [{
            range,
            text: imageMarkdown,
          }])
          editor._imageReplacePosition = null
        } else {
          // Normal insertion at cursor
          const position = editor.getPosition()
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          }
          editor.executeEdits('', [{
            range,
            text: imageMarkdown,
          }])
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column + imageMarkdown.length,
          })
        }

        editor.focus()
      } else {
        setContent(prev => prev + '\n' + imageMarkdown)
      }

      showToast('Image queued — will upload when you save', 'success')

    } catch (error) {
      console.error('Image queue failed:', error)
      showToast(`Failed to queue image: ${error.message}`, 'error')
    }
  }

  const handleFileInputChange = (e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])

  return { imageQueueRef, imageCountRef, handleImageUpload, handleFileInputChange }
}
