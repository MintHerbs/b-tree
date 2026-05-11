import GridLoader from '../smoothui/grid-loader/index.tsx'

export default function ObservingAnimation({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <GridLoader 
        blur={1.2}
        color="blue" 
        gap={1}
        mode="pulse" 
        pattern="plus-full"
        rounded
        size="sm"
      />
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}
