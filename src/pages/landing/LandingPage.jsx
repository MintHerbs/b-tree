// TODO: replace with neutral landing page when ready
// Currently redirects to /tree as the default tool
import { Navigate } from 'react-router-dom'

function LandingPage() {
  return <Navigate to="/tree" replace />
}

export default LandingPage
