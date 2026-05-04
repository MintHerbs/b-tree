import styles from './DynamicIsland.module.css'

export default function ErrorContent({ message }) {
  return (
    <>
      <div className={styles.errorDot} />
      <span className={styles.errorText}>{message}</span>
    </>
  )
}
