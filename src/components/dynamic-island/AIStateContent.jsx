import ObservingAnimation from './ObservingAnimation'
import WaitingAnimation from './WaitingAnimation'
import ThinkingAnimation from './ThinkingAnimation'
import GeneratingAnimation from './GeneratingAnimation'
import ErrorContent from './ErrorContent'

export default function AIStateContent({ aiState, errorMessage }) {
  if (aiState === 'observing') return <ObservingAnimation label="Observing" />
  if (aiState === 'waiting') return <WaitingAnimation label="Waiting" />
  if (aiState === 'processing') return <WaitingAnimation label="Thinking" />
  if (aiState === 'thinking') return <ThinkingAnimation label="Thinking..." />
  if (aiState === 'generating') return <GeneratingAnimation label="Generating..." />
  if (aiState === 'error') return <ErrorContent message={errorMessage} />
  return null
}
