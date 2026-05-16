import { useMemo, useRef, useState } from 'react'
import { Code2, Copy, Check } from 'lucide-react'
import { detectCodeLanguage, getLanguageLabel, normalizeLanguage } from '../../../../lib/social/codeHighlighter'
import styles from './CodeAttachment.module.css'

const LANG_OPTIONS = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
]

function getLineCount(value) {
  if (!value) return 0
  return String(value).split('\n').length
}

function clampToMaxLines(value, maxLines) {
  const lines = String(value ?? '').split('\n')
  if (lines.length <= maxLines) return String(value ?? '')
  return lines.slice(0, maxLines).join('\n')
}

export default function CodeAttachment({ code, language, onChange }) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef(null)
  
  const lineCount = useMemo(() => getLineCount(code), [code])
  const normalizedLanguage = normalizeLanguage(language)
  const detectedLanguage = useMemo(() => detectCodeLanguage(code), [code])

  const handleLangChange = (e) => {
    onChange(code ?? '', e.target.value)
  }

  const handleCodeChange = (e) => {
    const next = clampToMaxLines(e.target.value, 1000)
    onChange(next, normalizedLanguage || 'auto')
  }

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const lineNumbers = useMemo(() => {
    const count = Math.max(lineCount, 1)
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [lineCount])

  return (
    <div className={styles.wrapper}>
      {/* Header with language selector and actions */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Code2 size={16} className={styles.codeIcon} />
          <select 
            className={styles.select} 
            value={normalizedLanguage || 'auto'} 
            onChange={handleLangChange}
          >
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.headerRight}>
          <span className={styles.info}>
            {normalizedLanguage === 'auto' 
              ? `Detected: ${getLanguageLabel(detectedLanguage)}` 
              : `${lineCount}/1000 lines`}
          </span>
          <button 
            type="button"
            className={styles.copyBtn} 
            onClick={handleCopy}
            disabled={!code}
            title="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Code editor area */}
      <div className={styles.editorContainer}>
        <div className={styles.lineNumbers}>
          {lineNumbers.map((num) => (
            <div key={num} className={styles.lineNumber}>
              {num}
            </div>
          ))}
        </div>
        
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={code || ''}
          onChange={handleCodeChange}
          spellCheck={false}
          placeholder="Paste your code here..."
        />
      </div>
      
      {/* Footer hint */}
      <div className={styles.footer}>
        <span className={styles.hint}>
          Syntax highlighting will be applied when posted
        </span>
      </div>
    </div>
  )
}
