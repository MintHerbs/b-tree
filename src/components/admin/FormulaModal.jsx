import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import styles from './FormulaModal.module.css'

export default function FormulaModal({ open, onClose, onInsert }) {
  const [latex, setLatex] = useState('')
  const [displayMode, setDisplayMode] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setLatex('')
      setDisplayMode(false)
      setError('')
    }
  }, [open])

  const renderPreview = () => {
    if (!latex.trim()) return null

    try {
      const html = katex.renderToString(latex, {
        displayMode,
        throwOnError: true,
        output: 'html'
      })
      setError('')
      return <div dangerouslySetInnerHTML={{ __html: html }} />
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const handleInsert = () => {
    if (!latex.trim()) return

    try {
      // Validate LaTeX before inserting
      katex.renderToString(latex, { throwOnError: true })
      
      // Insert with proper markdown syntax
      const formula = displayMode ? `$$${latex}$$` : `$${latex}$`
      onInsert(formula)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Insert Formula</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>LaTeX Code</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g., \frac{a}{b} or x^2 + y^2 = z^2"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>

          <div className={styles.modeToggle}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
              />
              <span>Display mode (block formula)</span>
            </label>
          </div>

          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className={styles.preview}>
            <div className={styles.previewLabel}>Preview:</div>
            <div className={styles.previewContent}>
              {latex.trim() ? renderPreview() : (
                <span className={styles.emptyPreview}>Type LaTeX to see preview</span>
              )}
            </div>
          </div>

          <div className={styles.examples}>
            <div className={styles.examplesLabel}>Examples:</div>
            <div className={styles.examplesList}>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('\\frac{a}{b}')}
              >
                Fraction
              </button>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('x^2 + y^2 = z^2')}
              >
                Equation
              </button>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('\\sum_{i=1}^{n} i')}
              >
                Summation
              </button>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('\\int_{a}^{b} f(x) dx')}
              >
                Integral
              </button>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('\\sqrt{x^2 + y^2}')}
              >
                Square Root
              </button>
              <button
                className={styles.exampleButton}
                onClick={() => setLatex('\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}')}
              >
                Matrix
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.insertButton}
            onClick={handleInsert}
            disabled={!latex.trim() || !!error}
          >
            Insert Formula
          </button>
        </div>
      </div>
    </>
  )
}
