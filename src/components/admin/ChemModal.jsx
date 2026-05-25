import 'katex/contrib/mhchem'
import { useEffect, useMemo, useState } from 'react'
import { Atom, MathOperations, X } from '@phosphor-icons/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { colors } from '../../constants/colors'
import { inputToSvgDataUrl } from '../../lib/chemUtils'
import styles from './ChemModal.module.css'

export default function ChemModal({ open, onClose, onInsert }) {
  const [activeTab, setActiveTab] = useState('equation')
  const [equationInput, setEquationInput] = useState('')
  const [structureInput, setStructureInput] = useState('')
  const [previewDataUrl, setPreviewDataUrl] = useState(null)
  const [previewError, setPreviewError] = useState(null)
  const [previewing, setPreviewing] = useState(false)

  const resetState = () => {
    setActiveTab('equation')
    setEquationInput('')
    setStructureInput('')
    setPreviewDataUrl(null)
    setPreviewError(null)
    setPreviewing(false)
  }

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  useEffect(() => {
    setPreviewDataUrl(null)
    setPreviewError(null)
  }, [structureInput])

  const handleClose = () => {
    resetState()
    onClose()
  }

  const equationPreview = useMemo(() => {
    const input = equationInput.trim()
    if (!input) return { html: '', error: null }
    try {
      const html = katex.renderToString(`\\ce{${input}}`, { throwOnError: true, output: 'html' })
      return { html, error: null }
    } catch {
      return { html: '', error: 'Invalid equation' }
    }
  }, [equationInput])

  const handleInsertEquation = () => {
    const input = equationInput.trim()
    if (!input) return
    try {
      katex.renderToString(`\\ce{${input}}`, { throwOnError: true, output: 'html' })
    } catch {
      return
    }
    onInsert(`$$\\ce{${input}}$$`)
    handleClose()
  }

  const handlePreviewStructure = async () => {
    const input = structureInput.trim()
    if (!input) return

    setPreviewing(true)
    setPreviewError(null)

    try {
      const dataUrl = await inputToSvgDataUrl(input)
      setPreviewDataUrl(dataUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('not found in PubChem')) {
        setPreviewError('Compound not found — try a SMILES string instead')
      } else if (message.startsWith('Invalid SMILES:')) {
        setPreviewError('Invalid SMILES notation')
      } else {
        setPreviewError(message)
      }
    } finally {
      setPreviewing(false)
    }
  }

  const handleInsertStructure = () => {
    if (!previewDataUrl) return
    const input = structureInput.trim()
    if (!input) return
    onInsert(`![${input}](${previewDataUrl})`)
    handleClose()
  }

  if (!open) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={handleClose} />
      <div className={styles.modal} style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className={styles.header} style={{ borderBottom: `1px solid ${colors.border}` }}>
          <h2 className={styles.title} style={{ color: colors.text }}>Chemistry</h2>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close" style={{ color: colors.textMuted }}>
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className={styles.tabBar} style={{ borderBottom: `1px solid ${colors.border}` }}>
          <button
            type="button"
            className={styles.tabButton}
            onClick={() => setActiveTab('equation')}
            style={{
              color: activeTab === 'equation' ? colors.text : colors.textMuted,
              borderBottom: activeTab === 'equation' ? `2px solid ${colors.accent}` : '2px solid transparent',
            }}
          >
            <MathOperations size={16} />
            <span>Equation</span>
          </button>
          <button
            type="button"
            className={styles.tabButton}
            onClick={() => setActiveTab('structure')}
            style={{
              color: activeTab === 'structure' ? colors.text : colors.textMuted,
              borderBottom: activeTab === 'structure' ? `2px solid ${colors.accent}` : '2px solid transparent',
            }}
          >
            <Atom size={16} />
            <span>Structure</span>
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'equation' ? (
            <div className={styles.tabContent}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ color: colors.text }}>Chemical equation:</label>
                <input
                  className={styles.input}
                  value={equationInput}
                  onChange={(e) => setEquationInput(e.target.value)}
                  placeholder="2H2 + O2 -> 2H2O"
                  autoFocus
                />
                <div className={styles.hint} style={{ color: colors.textMuted }}>
                  Hint: Use -&gt; for reaction, &lt;=&gt; for equilibrium, ^ for superscript
                </div>
              </div>

              <div className={styles.previewGroup}>
                <div className={styles.previewLabel} style={{ color: colors.text }}>Preview:</div>
                <div className={styles.previewBox}>
                  {equationPreview.error ? (
                    <div style={{ color: colors.error }}>{equationPreview.error}</div>
                  ) : equationPreview.html ? (
                    <div dangerouslySetInnerHTML={{ __html: equationPreview.html }} />
                  ) : null}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.insertButton}
                  onClick={handleInsertEquation}
                  disabled={!equationInput.trim() || Boolean(equationPreview.error)}
                  style={{ background: colors.accent }}
                >
                  Insert
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.tabContent}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} style={{ color: colors.text }}>Molecule name or SMILES:</label>
                <input
                  className={styles.input}
                  value={structureInput}
                  onChange={(e) => setStructureInput(e.target.value)}
                  placeholder="benzene"
                  autoFocus
                />
                <div className={styles.hint} style={{ color: colors.textMuted }}>
                  e.g. "caffeine" or "C1=CC=CC=C1"
                </div>
              </div>

              <div className={styles.previewActions}>
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={handlePreviewStructure}
                  disabled={!structureInput.trim() || previewing}
                  style={{ border: `1px solid ${colors.border}`, color: colors.text }}
                >
                  {previewing ? 'Loading...' : 'Preview structure'}
                </button>
              </div>

              <div className={styles.previewBox}>
                {previewError ? (
                  <div style={{ color: colors.error }}>{previewError}</div>
                ) : previewDataUrl ? (
                  <img className={styles.previewImage} src={previewDataUrl} alt={structureInput.trim()} />
                ) : null}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.insertButton}
                  onClick={handleInsertStructure}
                  disabled={!previewDataUrl}
                  style={{ background: colors.accent }}
                >
                  Insert
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
