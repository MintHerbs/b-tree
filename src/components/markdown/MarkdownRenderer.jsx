import 'katex/contrib/mhchem'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import RichPopover, { YouTubeIcon, InstagramIcon, LinkedInIcon } from '../ui/RichPopover'
import styles from './MarkdownRenderer.module.css'

function resolveImageSrc(src = '') {
  if (!src.startsWith('/notes/img/')) return src

  const owner = import.meta.env.VITE_GITHUB_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'

  if (!owner || !repo) return src

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${src}`
}

function parseTagProps(attrString) {
  const props = {}
  const attrRegex = /(\w+)="((?:[^"\\]|\\.)*)"/g
  let match
  while ((match = attrRegex.exec(attrString)) !== null) {
    props[match[1]] = match[2].replace(/\\"/g, '"').replace(/&quot;/g, '"')
  }
  return props
}

function getPlatformTriggerIcon(platform) {
  switch (platform) {
    case 'youtube': return <YouTubeIcon className={styles.socialTriggerIcon} />
    case 'instagram': return <InstagramIcon className={styles.socialTriggerIcon} />
    case 'linkedin': return <LinkedInIcon className={styles.socialTriggerIcon} />
    default: return <YouTubeIcon className={styles.socialTriggerIcon} />
  }
}

function SocialLinkPopover({ platform, title, href, description, meta, actionLabel }) {
  // Trigger is always a 36×36 rounded square showing only the platform icon.
  const trigger = (
    <button className={styles.socialTrigger} type="button" aria-label={title || 'social link'}>
      {getPlatformTriggerIcon(platform)}
    </button>
  )

  return (
    <RichPopover
      trigger={trigger}
      platform={platform}
      title={title}
      href={href}
      description={description}
      meta={meta}
      actionLabel={actionLabel}
      actionHref={href}
      side="top"
      align="center"
    />
  )
}

function splitContentByCustomTags(content) {
  const parts = []
  const regex = /<(SocialLink)([\s\S]*?)\/>/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: content.slice(lastIndex, match.index) })
    }
    const tagName = match[1].toLowerCase()
    const props = parseTagProps(match[2])
    parts.push({ type: tagName, props })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) })
  }

  return parts
}

const markdownComponents = {
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
  h1({ children }) {
    return <h1 className={styles.h1}>{children}</h1>
  },
  h2({ children }) {
    return <h2 className={styles.h2}>{children}</h2>
  },
  h3({ children }) {
    return <h3 className={styles.h3}>{children}</h3>
  },
  blockquote({ children }) {
    return <blockquote className={styles.blockquote}>{children}</blockquote>
  },
  hr() {
    return <hr className={styles.hr} />
  },
  p({ children }) {
    return <p className={styles.paragraph}>{children}</p>
  },
  ul({ children }) {
    return <ul className={styles.ul}>{children}</ul>
  },
  ol({ children }) {
    return <ol className={styles.ol}>{children}</ol>
  },
  li({ children }) {
    return <li className={styles.li}>{children}</li>
  },
  img({ src, alt }) {
    return (
      <img
        className={styles.image}
        src={resolveImageSrc(src)}
        alt={alt || ''}
        loading="lazy"
      />
    )
  },
}

// Same component overrides as above, but paragraphs render inline (no block
// <p>) so text that sits directly against an inline SocialLink chip flows
// within the sentence instead of being pushed onto its own line.
const inlineMarkdownComponents = {
  ...markdownComponents,
  p({ children }) {
    return <>{children}</>
  },
}

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeKatex]

// Split a markdown segment into block-paragraph chunks at blank lines, so the
// single chunk that touches an inline chip can be rendered inline while the
// other paragraphs stay block-level.
function splitIntoBlockChunks(content) {
  return content.split(/\n[ \t]*\n/)
}

function MarkdownRenderer({ content }) {
  const parts = splitContentByCustomTags(content)

  return (
    <div className={styles.markdownContainer}>
      {parts.map((part, i) => {
        if (part.type === 'sociallink') {
          return (
            <span key={i} className={styles.socialLinkWrapper}>
              <SocialLinkPopover {...part.props} />
            </span>
          )
        }

        // A markdown segment that is not adjacent to an inline SocialLink chip
        // renders exactly as before — a single block-level markdown render.
        const inlineHead = parts[i - 1]?.type === 'sociallink'
        const inlineTail = parts[i + 1]?.type === 'sociallink'
        if (!inlineHead && !inlineTail) {
          return (
            <ReactMarkdown
              key={i}
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={markdownComponents}
            >
              {part.content}
            </ReactMarkdown>
          )
        }

        // Adjacent to a chip: render the boundary chunk(s) inline so the chip
        // flows within the sentence, while any other paragraphs stay block.
        const chunks = splitIntoBlockChunks(part.content)
        return chunks.map((chunk, j) => {
          const isHead = j === 0
          const isTail = j === chunks.length - 1
          const renderInline = (isHead && inlineHead) || (isTail && inlineTail)
          return (
            <ReactMarkdown
              key={`${i}-${j}`}
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={renderInline ? inlineMarkdownComponents : markdownComponents}
            >
              {chunk}
            </ReactMarkdown>
          )
        })
      })}
    </div>
  )
}

export default MarkdownRenderer
