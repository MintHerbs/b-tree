// Pagination dots indicator for multi-step flows
import styles from './PaginationDots.module.css'

function PaginationDots({ total, current }) {
  return (
    <div className={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`${styles.dot} ${index + 1 === current ? styles.active : ''}`}
        />
      ))}
    </div>
  )
}

export default PaginationDots
