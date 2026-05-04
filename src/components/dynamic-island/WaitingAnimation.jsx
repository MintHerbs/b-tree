import GridLoader from '../smoothui/grid-loader/index.tsx'

export default function WaitingAnimation({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <GridLoader 
        blur={1}
        color="white" 
        gap={1}
        mode="stagger" 
        pattern="frame"
        size="sm"
      />
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}
