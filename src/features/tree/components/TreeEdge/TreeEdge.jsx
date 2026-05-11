// Renders an SVG line or path between parent and child nodes
import styles from './TreeEdge.module.css'

function TreeEdge({ from, to, isLeafPointer = false }) {
  const { x: x1, y: y1 } = from
  const { x: x2, y: y2 } = to

  if (isLeafPointer) {
    // Leaf-to-leaf pointer: horizontal dashed line with arrow
    return (
      <line
        className={styles.leafPointer}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        markerEnd="url(#leaf-arrow)"
      />
    )
  }

  // Parent-to-child edge: solid line
  return (
    <line
      className={styles.edge}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
    />
  )
}

export default TreeEdge
