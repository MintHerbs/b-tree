/**
 * SymbolBar - Logic symbol insertion toolbar
 * 
 * Displays a row of clickable logic symbols that insert at cursor position.
 * Symbols: ¬ (not), ∧ (and), ∨ (or), → (implies), ↔ (iff), ∴ (therefore), ⊤ (true), ⊥ (false)
 * 
 * @param {Object} props
 * @param {React.RefObject} props.inputRef - Reference to the input element
 */
import styles from './SymbolBar.module.css'

const SYMBOLS = [
  { symbol: '¬', label: 'NOT' },
  { symbol: '∧', label: 'AND' },
  { symbol: '∨', label: 'OR' },
  { symbol: '→', label: 'IMPLIES' },
  { symbol: '↔', label: 'IFF' },
  { symbol: '∴', label: 'THEREFORE' },
  { symbol: '⊤', label: 'TRUE' },
  { symbol: '⊥', label: 'FALSE' }
]

export default function SymbolBar({ inputRef }) {
  const handleSymbolClick = (symbol) => {
    if (!inputRef.current) return

    const input = inputRef.current
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0

    // Insert symbol at cursor position
    input.setRangeText(symbol, start, end, 'end')

    // Dispatch input event so React state updates
    const event = new Event('input', { bubbles: true })
    input.dispatchEvent(event)

    // Refocus the input
    input.focus()
  }

  return (
    <div className={styles.symbolBar}>
      {SYMBOLS.map(({ symbol, label }) => (
        <button
          key={symbol}
          type="button"
          className={styles.symbolButton}
          onClick={() => handleSymbolClick(symbol)}
          title={label}
          aria-label={label}
        >
          {symbol}
        </button>
      ))}
    </div>
  )
}
