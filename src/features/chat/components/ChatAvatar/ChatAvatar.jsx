// Wrapper around AgentAvatar - renders unique avatar for each session UUID
import AgentAvatar from '../../../../components/effects/smoothui/agent-avatar'

export default function ChatAvatar({ sessionId, size }) {
  return (
    <div
      style={{
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <AgentAvatar seed={sessionId} size={size || 36} animated={true} />
    </div>
  )
}
