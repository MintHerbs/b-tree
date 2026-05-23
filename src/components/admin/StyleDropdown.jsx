import * as Popover from '@radix-ui/react-popover'
import { CaretDown } from '@phosphor-icons/react'
import styles from './StyleDropdown.module.css'

export default function StyleDropdown({ currentStyle, onStyleChange }) {
  const styleLabels = {
    title: 'Title',
    subtitle: 'Subtitle',
    body: 'Body'
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={styles.trigger}>
          <span>{styleLabels[currentStyle]}</span>
          <CaretDown size={12} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.content} sideOffset={5}>
          <button
            className={`${styles.option} ${currentStyle === 'title' ? styles.active : ''}`}
            onClick={() => onStyleChange('title')}
          >
            <span className={styles.bullet}>{currentStyle === 'title' ? '●' : '○'}</span>
            <span className={styles.label}>Title</span>
            <span className={styles.hint}>(H1)</span>
          </button>
          <button
            className={`${styles.option} ${currentStyle === 'subtitle' ? styles.active : ''}`}
            onClick={() => onStyleChange('subtitle')}
          >
            <span className={styles.bullet}>{currentStyle === 'subtitle' ? '●' : '○'}</span>
            <span className={styles.label}>Subtitle</span>
            <span className={styles.hint}>(H2)</span>
          </button>
          <button
            className={`${styles.option} ${currentStyle === 'body' ? styles.active : ''}`}
            onClick={() => onStyleChange('body')}
          >
            <span className={styles.bullet}>{currentStyle === 'body' ? '●' : '○'}</span>
            <span className={styles.label}>Body</span>
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
