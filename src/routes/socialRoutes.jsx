import { lazy, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

export const HomeFeedPage = lazy(() =>
  new Promise(resolve =>
    setTimeout(() => resolve(import('../pages/HomeFeedPage')), 300)
  )
)
export const GuidelinesPage = lazy(() => import('../pages/social/guidelines'))

export function SocialChatRoute({ onChatOpen }) {
  useEffect(() => {
    onChatOpen?.()
  }, [onChatOpen])

  return <Navigate to="/social/feed" replace />
}

export function preloadSocialRoutes() {
  import('../pages/HomeFeedPage')
  import('../pages/social/guidelines')
}
