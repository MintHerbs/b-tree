// Pure SVG edge functions for ERD connections

export function renderSingleLine(x1, y1, x2, y2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.5" />
}

export function renderDoubleLine(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return renderSingleLine(x1, y1, x2, y2)

  // Perpendicular unit vector, offset 2px each side = 4px total gap
  const px = (-dy / len) * 2
  const py = (dx / len) * 2

  return (
    <g>
      <line x1={x1 + px} y1={y1 + py} x2={x2 + px} y2={y2 + py} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={x1 - px} y1={y1 - py} x2={x2 - px} y2={y2 - py} stroke="#94a3b8" strokeWidth="1.5" />
    </g>
  )
}

export function renderAttributeLine(x1, y1, x2, y2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1" />
}
