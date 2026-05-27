import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import RichPopover, { YouTubeIcon, InstagramIcon, LinkedInIcon } from '../ui/RichPopover'
import styles from './SocialLinkModal.module.css'

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', Icon: YouTubeIcon, defaultAction: 'Watch video', hasMeta: true },
  { id: 'instagram', label: 'Instagram', Icon: InstagramIcon, defaultAction: 'View', hasMeta: false },
  { id: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon, defaultAction: 'View', hasMeta: false },
]

function getPlatform(id) {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]
}

function escapeAttr(value) {
  return String(value).replace(/"/g, '&quot;')
}

export default function SocialLinkModal({ open, onClose, onInsert }) {
  const [platform, setPlatform] = useState('youtube')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meta, setMeta] = useState('')
  const [actionLabel, setActionLabel] = useState('Watch video')

  // Reset all fields whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setPlatform('youtube')
      setUrl('')
      setTitle('')
      setDescription('')
      setMeta('')
      setActionLabel('Watch video')
    }
  }, [open])

  // Apply the platform's default action label when the tab changes.
  function handleSelectPlatform(id) {
    setPlatform(id)
    setActionLabel(getPlatform(id).defaultAction)
    if (!getPlatform(id).hasMeta) setMeta('')
  }

  const selected = getPlatform(platform)
  const PlatformIcon = selected.Icon

  function buildTag() {
    const attrs = [`platform="${platform}"`, `href="${escapeAttr(url)}"`, `title="${escapeAttr(title)}"`]
    if (description.trim()) attrs.push(`description="${escapeAttr(description)}"`)
    if (selected.hasMeta && meta.trim()) attrs.push(`meta="${escapeAttr(meta)}"`)
    if (actionLabel.trim()) attrs.push(`actionLabel="${escapeAttr(actionLabel)}"`)
    return `<SocialLink ${attrs.join(' ')} />`
  }

  function handleInsert() {
    if (!url.trim() || !title.trim()) return
    onInsert(buildTag())
    onClose()
  }

  if (!open) return null

  // Icon-only 36×36 trigger, matching the library demo and the rendered output.
  const previewTrigger = (
    <button type="button" className={styles.iconTrigger} aria-label={`${selected.label} link`}>
      <PlatformIcon className={styles.triggerIcon} />
    </button>
  )

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>Insert social link</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className={styles.content}>
          {/* Platform tabs */}
          <div className={styles.tabs}>
            {PLATFORMS.map((p) => {
              const TabIcon = p.Icon
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.tab} ${platform === p.id ? styles.tabActive : ''}`}
                  onClick={() => handleSelectPlatform(p.id)}
                >
                  <TabIcon className={styles.tabIcon} />
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., Intro to B+ Trees"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL *</label>
            <input
              type="url"
              className={styles.input}
              placeholder={`https://${platform}.com/...`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Brief description shown in the popover…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            {selected.hasMeta && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Timestamp (optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 0:00–2:15"
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Action label</label>
              <input
                type="text"
                className={styles.input}
                placeholder={selected.defaultAction}
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
              />
            </div>
          </div>

          {/* Live preview */}
          <div className={styles.preview}>
            <span className={styles.previewLabel}>Live preview — click the icon</span>
            <div className={styles.previewStage}>
              <RichPopover
                trigger={previewTrigger}
                platform={platform}
                title={title || 'Title'}
                href={url || undefined}
                description={description || undefined}
                meta={selected.hasMeta ? meta || undefined : undefined}
                actionLabel={actionLabel || undefined}
                actionHref={url || undefined}
                side="top"
                align="center"
              />
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
            disabled={!url.trim() || !title.trim()}
          >
            Insert link
          </button>
        </div>
      </div>
    </>
  )
}
