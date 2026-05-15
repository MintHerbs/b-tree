import { detectCodeLanguage, getLanguageLabel, normalizeLanguage, tokenizeCodeLine } from '../../../lib/social/codeHighlighter'
import styles from './CodeBlock.module.css'

export default function CodeBlock({ code, language }) {
  const requestedLanguage = normalizeLanguage(language)
  const detectedLanguage = requestedLanguage === 'auto' ? detectCodeLanguage(code) : requestedLanguage
  const lines = String(code || '').split('\n')

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <span>{getLanguageLabel(detectedLanguage)}</span>
        {requestedLanguage === 'auto' && <span className={styles.detected}>detected</span>}
      </div>

      <pre className={styles.pre}>
        <code>
          {lines.map((line, lineIndex) => (
            <span key={`${lineIndex}-${line}`} className={styles.line}>
              <span className={styles.lineNumber}>{lineIndex + 1}</span>
              <span className={styles.source}>
                {tokenizeCodeLine(line, detectedLanguage).map((token, tokenIndex) => (
                  <span key={`${lineIndex}-${tokenIndex}`} className={styles[token.type] || undefined}>
                    {token.value}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
