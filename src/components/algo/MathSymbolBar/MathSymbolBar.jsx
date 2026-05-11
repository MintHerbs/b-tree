/**
 * MathSymbolBar - Math symbol insertion toolbar
 * 
 * Displays a row of clickable math symbols for recurrence formulas.
 * Symbols: + − × ÷ ^ log ( ) T(n)
 * 
 * @param {Object} props
 * @param {Function} props.onInsert - Callback function to insert symbol text
 */
import styles from './MathSymbolBar.module.css'

const SYMBOLS = [
  { symbol: '+', text: '+', label: 'Plus' },
  { symbol: '−', text: '-', label: 'Minus' },
  { symbol: '×', text: '*', label: 'Multiply' },
  { symbol: '÷', text: '/', label: 'Divide' },
  { symbol: '^', text: '^', label: 'Exponent' },
  { symbol: 'log', text: 'log(', label: 'Logarithm' },
  { symbol: '(', text: '(', label: 'Left Parenthesis' },
  { symbol: ')', text: ')', label: 'Right Parenthesis' },
  { symbol: 'T(n)', text: 'T(n)', label: 'T(n)' }
]

export default function MathSymbolBar({ onInsert }) {
  const handleSymbolClick = (text) => {
    if (onInsert) {
      onInsert(text)
    }
  }

  return (
    <div className={styles.symbolBar}>
      {SYMBOLS.map(({ symbol, text, label }) => (
        <button
          key={symbol}
          type="button"
          className={styles.symbolButton}
          onClick={() => handleSymbolClick(text)}
          title={label}
          aria-label={label}
        >
          {symbol}
        </button>
      ))}
    </div>
  )
}
