import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Starfield from '../components/effects/Starfield/Starfield'
import PostComposer from '../components/social/PostComposer/PostComposer'
import PostCard from '../components/social/PostCard/PostCard'
import OnboardingCarousel from '../components/social/OnboardingCarousel/OnboardingCarousel'
import { usePosts } from '../hooks/usePosts'
import { useRateLimit } from '../hooks/useRateLimit'
import styles from './HomeFeedPage.module.css'

function FeedSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <motion.div 
          key={i} 
          className={styles.skeletonCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        >
          <div className={styles.pulseLine} style={{ width: '45%' }}>
            <div className={styles.shimmer} />
          </div>
          <div className={styles.pulseLine} style={{ width: '100%' }}>
            <div className={styles.shimmer} />
          </div>
          <div className={styles.pulseLine} style={{ width: '92%' }}>
            <div className={styles.shimmer} />
          </div>
          <div className={styles.pulseLine} style={{ width: '78%' }}>
            <div className={styles.shimmer} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function HomeFeedPage({ onAIStateChange }) {
  const sessionId = localStorage.getItem('session_id') || 'anonymous'
  const [showCarousel, setShowCarousel] = useState(false)
  const [navOffset, setNavOffset] = useState(64)

  useRateLimit()

  const {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    votePost,
    flagPost,
    getUserVote,
    hasUserFlagged,
  } = usePosts()

  useEffect(() => {
    onAIStateChange?.('idle')
  }, [onAIStateChange])

  useLayoutEffect(() => {
    const updateNavOffset = () => {
      const navHeight = document.querySelector('[data-navbar]')?.offsetHeight ?? 64
      setNavOffset(navHeight)
      document.documentElement.style.setProperty('--nav-offset', `${navHeight}px`)
    }

    updateNavOffset()
    window.addEventListener('resize', updateNavOffset)
    return () => window.removeEventListener('resize', updateNavOffset)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('social_onboarded')) setShowCarousel(true)
  }, [])

  const feedPosts = useMemo(() => {
    return (posts || []).map((p) => ({
      ...p,
      userVote: getUserVote?.(p.id),
      hasFlagged: hasUserFlagged?.(p.id),
      commentCount: p.comment_count ?? 0,
    }))
  }, [getUserVote, hasUserFlagged, posts])

  return (
    <div className={styles.page}>
      <Starfield />

      <div className={styles.feedColumn} style={{ '--nav-offset': `${navOffset}px` }}>
        <main className={styles.main}>
          <PostComposer sessionId={sessionId} onPost={(postData) => createPost?.(postData)} />

          {isLoading && <FeedSkeleton />}

          <AnimatePresence mode="wait">
            {!isLoading && feedPosts.length === 0 && (
              <motion.div 
                className={styles.empty}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                No posts yet. Be the first to share something.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {!isLoading &&
              feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  sessionId={sessionId}
                  onVote={(postId, voteType) => votePost?.(postId, voteType)}
                  onFlag={(postId) => flagPost?.(postId)}
                  onEdit={(postId, data) => updatePost?.(postId, data)}
                  onDelete={(postId) => deletePost?.(postId)}
                />
              ))}
          </AnimatePresence>
        </main>
      </div>

      {showCarousel && (
        <OnboardingCarousel onComplete={() => setShowCarousel(false)} />
      )}
    </div>
  )
}
