import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RippleButton, RippleButtonRipples } from '@/components/animate-ui/primitives/buttons/ripple'
import { MessageCircleHeart } from '@/components/animate-ui/icons/message-circle-heart'
import styles from './OnboardingCarousel.module.css'

export default function OnboardingCarousel({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const [flagActive, setFlagActive] = useState(false)
  const touchStartRef = useRef(null)
  const hasAnimatedWelcomeRef = useRef(false)

  const goTo = (idx) => setSlide(Math.max(0, Math.min(2, idx)))
  const goNext = () => setSlide((s) => Math.min(2, s + 1))
  const goBack = () => setSlide((s) => Math.max(0, s - 1))

  useEffect(() => {
    if (slide === 0) hasAnimatedWelcomeRef.current = true
    setFlagActive(false)
    if (slide !== 2) return undefined
    const t = window.setTimeout(() => setFlagActive(true), 600)
    return () => window.clearTimeout(t)
  }, [slide])

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const touch = e.changedTouches?.[0]
    if (!touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) goNext()
    else goBack()
  }

  const content = useMemo(() => {
    if (slide === 0) {
      return (
        <>
          <div className={styles.iconWrap}>
            <MessageCircleHeart
              size={56}
              animate={hasAnimatedWelcomeRef.current ? false : 'default'}
              animateOnHover="default"
              className={styles.welcomeIcon}
            />
          </div>

          <div className={styles.heading}>Welcome to the Global Feed</div>

          <div className={styles.body}>
            You are completely anonymous here. No names, no accounts — just ideas.
            <br />
            <br />
            Your session ID is randomly generated. Nobody knows who you are, not even us.
          </div>

          <RippleButton type="button" className={styles.primaryBtn} onClick={goNext}>
            Continue
            <RippleButtonRipples />
          </RippleButton>
        </>
      )
    }

    if (slide === 1) {
      return (
        <>
          <div className={styles.heading}>Be Respectful</div>
          <div className={styles.subheading}>This is a shared space for students.</div>

          <div className={styles.rules}>
            <div className={styles.ruleGroup}>
              <div className={styles.ruleTitle}>Do:</div>
              <div className={styles.ruleLine}>✓ Ask genuine questions</div>
              <div className={styles.ruleLine}>✓ Share study tips &amp; resources</div>
              <div className={styles.ruleLine}>✓ Support your fellow students</div>
            </div>

            <div className={styles.ruleGroup}>
              <div className={styles.ruleTitle}>Don&apos;t:</div>
              <div className={styles.ruleLine}>✗ Harass or target others</div>
              <div className={styles.ruleLine}>✗ Spam or post off-topic</div>
              <div className={styles.ruleLine}>✗ Share personal information</div>
            </div>
          </div>

          <Link className={styles.guidelinesLink} to="/social/guidelines">
            Read full guidelines
          </Link>

          <RippleButton type="button" className={styles.primaryBtn} onClick={goNext}>
            Continue
            <RippleButtonRipples />
          </RippleButton>
        </>
      )
    }

    return (
      <>
        <div className={`${styles.flagIcon} ${flagActive ? styles.flagIconActive : ''}`}>
          <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L14.06 4.5V11.5L8 15L1.94 11.5V4.5L8 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        <div className={styles.heading}>Community Safety</div>

        <div className={styles.body}>
          Every post has a flag button — the hexagon icon you just saw.
          <br />
          <br />
          If 10 people flag a post, it&apos;s automatically removed for review.
          <br />
          <br />
          Use it to keep this space safe. Use it responsibly.
        </div>

        <RippleButton
          type="button"
          className={styles.primaryBtn}
          onClick={() => {
            localStorage.setItem('social_onboarded', 'true')
            onComplete?.()
          }}
        >
          Got it
          <RippleButtonRipples />
        </RippleButton>
      </>
    )
  }, [flagActive, goNext, onComplete, slide])

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} />
      <div className={styles.center}>
        <div className={styles.card} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className={styles.slide}>{content}</div>

          <div className={styles.dots}>
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${slide === i ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
