import GridLoader from '../../effects/smoothui/grid-loader/index.tsx'

export default function ThinkingAnimation({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <GridLoader
        blur={1}
        color="amber"
        gap={1}
        mode="stagger"
        pattern="frame"
        size="sm"
      />
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
        {label}
      </span>
    </div>
  )
}
