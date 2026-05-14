import { useMemo } from 'react'
import styles from './CodeAttachment.module.css'

const LANG_OPTIONS = [
  { value: 'python', label: 'python' },
  { value: 'javascript', label: 'javascript' },
  { value: 'java', label: 'java' },
  { value: 'c++', label: 'c++' },
  { value: 'other', label: 'other' },
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
  const lineCount = useMemo(() => getLineCount(code), [code])

  const handleLangChange = (e) => {
    onChange(code ?? '', e.target.value)
  }

  const handleCodeChange = (e) => {
    const next = clampToMaxLines(e.target.value, 300)
    onChange(next, language || 'python')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <select className={styles.select} value={language || 'python'} onChange={handleLangChange}>
          {LANG_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={styles.counter}>{lineCount}/300 lines</div>
      </div>
      <textarea className={styles.textarea} value={code || ''} onChange={handleCodeChange} spellCheck={false} />
    </div>
  )
}
