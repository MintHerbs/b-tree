// Animated arrow showing current insertion/traversal path
import styles from './PointerArrow.module.css'

function PointerArrow({ from, to, label }) {
  if (!from || !to) return null

  const { x: x1, y: y1 } = from
  const { x: x2, y: y2 } = to

  // Calculate midpoint for label
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g className={styles.arrow}>
      <line
        className={styles.arrowLine}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        markerEnd="url(#pointer-arrow)"
      />
      {label && (
        <text
          className={styles.arrowLabel}
          x={midX}
          y={midY - 10}
        >
          {label}
        </text>
      )}
    </g>
  )
}

export default PointerArrow
