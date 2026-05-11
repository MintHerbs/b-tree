// Renders a single B+ tree node with alternating pointer slots and key slots
import styles from './TreeNode.module.css'
import { getNodeSlots } from '../../lib/treeLayout'

function TreeNode({ node, isHighlighted, highlightedKeys = [] }) {
  const { id, x, y, keys, width, height, isLeaf, keySlotWidths = [] } = node
  
  // Get slot layout for this node
  const slots = getNodeSlots(keys.length, keySlotWidths)

  return (
    <g className={styles.node} transform={`translate(${x - width / 2}, ${y - height / 2})`}>
      {/* Main node rectangle */}
      <rect
        className={`${styles.nodeRect} ${isHighlighted ? styles.highlighted : ''}`}
        width={width}
        height={height}
        rx="4"
      />

      {/* Render each slot */}
      {slots.map((slot, index) => {
        if (slot.type === 'pointer') {
          return (
            <rect
              key={`slot-${index}`}
              className={styles.pointerSlot}
              x={slot.x}
              y={0}
              width={slot.width}
              height={height}
            />
          )
        } else {
          // Key slot
          const keyValue = keys[slot.keyIndex]
          const isKeyHighlighted = highlightedKeys.some(
            k => String(k).toLowerCase() === String(keyValue).toLowerCase()
          )

          return (
            <g key={`slot-${index}`}>
              <rect
                className={styles.keySlot}
                x={slot.x}
                y={0}
                width={slot.width}
                height={height}
              />
              <text
                className={`${styles.keyText} ${isKeyHighlighted ? styles.highlightedKey : ''}`}
                x={slot.x + slot.width / 2}
                y={height / 2}
              >
                {keyValue}
              </text>
            </g>
          )
        }
      })}

      {/* Leaf indicator (optional visual cue) */}
      {isLeaf && (
        <text
          className={styles.leafLabel}
          x={width / 2}
          y={height + 16}
        >
          leaf
        </text>
      )}
    </g>
  )
}

export default TreeNode
