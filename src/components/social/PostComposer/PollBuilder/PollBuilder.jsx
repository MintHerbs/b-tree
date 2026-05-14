import { useMemo } from 'react'
import styles from './PollBuilder.module.css'

function normalizePoll(poll) {
  if (poll?.type === 'binary') {
    return { type: 'binary', options: ['Yes', 'No'] }
  }

  const options = Array.isArray(poll?.options) ? poll.options : []
  const padded = [...options]
  while (padded.length < 2) padded.push('')
  return { type: 'poll', options: padded.slice(0, 4) }
}

export default function PollBuilder({ poll, onChange }) {
  const normalized = useMemo(() => normalizePoll(poll), [poll])
  const isBinary = normalized.type === 'binary'

  const options = normalized.options

  const updateOption = (index, value) => {
    const next = { ...normalized, options: [...options] }
    next.options[index] = value.slice(0, 100)
    onChange(next)
  }

  const addOption = () => {
    if (isBinary) return
    if (options.length >= 4) return
    onChange({ ...normalized, options: [...options, ''] })
  }

  const removeOption = (index) => {
    if (isBinary) return
    if (options.length <= 2) return
    onChange({ ...normalized, options: options.filter((_, i) => i !== index) })
  }

  return (
    <div className={styles.builder}>
      {options.map((value, idx) => (
        <div key={idx} className={styles.optionRow}>
          <input
            className={styles.input}
            value={value}
            maxLength={100}
            onChange={(e) => updateOption(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            readOnly={isBinary}
          />
          {!isBinary && idx >= 2 && (
            <button type="button" className={styles.removeBtn} onClick={() => removeOption(idx)}>
              × Remove
            </button>
          )}
        </div>
      ))}

      <button type="button" className={styles.addBtn} onClick={addOption} disabled={isBinary || options.length >= 4}>
        + Add option
      </button>
    </div>
  )
}
