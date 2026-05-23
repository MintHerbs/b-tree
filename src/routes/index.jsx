import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import { routeComponents, NotesPage, preloadAcademiaRoutes } from './academiaRoutes'
import { HomeFeedPage, GuidelinesPage, SocialChatRoute, preloadSocialRoutes } from './socialRoutes'

// Admin routes
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'))
const AdminEditor = lazy(() => import('../pages/admin/AdminEditor'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))

export function AppRoutes({ onAIStateChange, onChatOpen }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {Object.entries(routeComponents).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={<Component onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />}
        />
      ))}
      <Route path="/notes/:section/*" element={<NotesPage />} />

      <Route path="/social/feed" element={<HomeFeedPage onAIStateChange={onAIStateChange} onChatOpen={onChatOpen} />} />
      <Route path="/social/chat" element={<SocialChatRoute onChatOpen={onChatOpen} />} />
      <Route path="/social/guidelines" element={<GuidelinesPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/editor" element={<AdminEditor />} />
      <Route path="/admin/users" element={<AdminUsers />} />
    </Routes>
  )
}

export function preloadRoutes() {
  preloadAcademiaRoutes()
  preloadSocialRoutes()
}
