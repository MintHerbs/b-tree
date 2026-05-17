import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import styles from './MarkdownRenderer.module.css'

/**
 * MarkdownRenderer - Renders markdown content with support for:
 * - LaTeX math formulas (inline and block)
 * - Tables (GitHub Flavored Markdown)
 * - Code blocks with syntax highlighting
 * - Headers, lists, blockquotes, etc.
 */
function MarkdownRenderer({ content }) {
  return (
    <div className={styles.markdownContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom rendering for code blocks with syntax highlighting
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')
            const isBlock = Boolean(match) || codeString.includes('\n')

            return isBlock ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language || 'text'}
                PreTag="div"
                className={styles.codeBlock}
                showLineNumbers={false}
                customStyle={{
                  margin: '1.5rem 0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  padding: '1.5rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                  }
                }}
              >
                {codeString}
              </SyntaxHighlighter>
            ) : (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            )
          },
          // Custom rendering for tables
          table({ children }) {
            return (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className={styles.thead}>{children}</thead>
          },
          tbody({ children }) {
            return <tbody className={styles.tbody}>{children}</tbody>
          },
          tr({ children }) {
            return <tr className={styles.tr}>{children}</tr>
          },
          th({ children }) {
            return <th className={styles.th}>{children}</th>
          },
          td({ children }) {
            return <td className={styles.td}>{children}</td>
          },
          // Custom rendering for headers
          h1({ children }) {
            return <h1 className={styles.h1}>{children}</h1>
          },
          h2({ children }) {
            return <h2 className={styles.h2}>{children}</h2>
          },
          h3({ children }) {
            return <h3 className={styles.h3}>{children}</h3>
          },
          // Custom rendering for blockquotes
          blockquote({ children }) {
            return <blockquote className={styles.blockquote}>{children}</blockquote>
          },
          // Custom rendering for horizontal rules
          hr() {
            return <hr className={styles.hr} />
          },
          // Custom rendering for paragraphs
          p({ children }) {
            return <p className={styles.paragraph}>{children}</p>
          },
          // Custom rendering for lists
          ul({ children }) {
            return <ul className={styles.ul}>{children}</ul>
          },
          ol({ children }) {
            return <ol className={styles.ol}>{children}</ol>
          },
          li({ children }) {
            return <li className={styles.li}>{children}</li>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
