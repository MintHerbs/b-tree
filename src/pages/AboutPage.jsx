// About page with Lottie animation and personal story
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import lottie from 'lottie-web'
import Starfield from '../components/Starfield/Starfield'
import Sidebar from '../components/Sidebar/Sidebar'
// import alienAnimation from '../img/alien.json' // Temporarily disabled
import styles from './AboutPage.module.css'

function AboutPage() {
  const navigate = useNavigate()
  const [showFullText, setShowFullText] = useState(false)
  const lottieRef = useRef(null)

  // Handle tool switching from sidebar
  const handleToolChange = (tool) => {
    if (tool === 'btree') {
      navigate('/')
    } else if (tool === 'erd') {
      navigate('/')
    } else if (tool === 'calculator') {
      window.open('https://lazy-grades.vercel.app/', '_blank')
    }
  }

  // Load Lottie animation
  useEffect(() => {
    let animationInstance = null

    if (lottieRef.current) {
      try {
        // Clear any existing content first
        lottieRef.current.innerHTML = ''
        
        // Temporarily use emoji fallback
        lottieRef.current.innerHTML = '<div class="' + styles.alienEmoji + '">👽</div>'
        
        /* Lottie animation disabled temporarily
        animationInstance = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: alienAnimation
        })
        */
      } catch (error) {
        console.error('Failed to load Lottie:', error)
        // Fallback: show animated emoji if Lottie fails to load
        if (lottieRef.current) {
          lottieRef.current.innerHTML = '<div class="' + styles.alienEmoji + '">👽</div>'
        }
      }
    }

    return () => {
      if (animationInstance) {
        animationInstance.destroy()
      }
    }
  }, [])

  return (
    <div className={styles.aboutPage}>
      {/* Starfield background */}
      <Starfield />
      
      {/* Sidebar */}
      <Sidebar 
        activeTool={null}
        onToolChange={handleToolChange}
      />
      
      {/* Main content */}
      <main className={styles.content}>
        {/* Lottie animation */}
        <div ref={lottieRef} className={styles.animation} />
        
        {/* Text content */}
        <div className={styles.textContainer}>
          <p className={styles.intro}>
            Just a dude who codes sometimes, gets lost in fantasy novels (Tolkien, Herbert - the ones that make you question reality a little), and is currently down a rabbit hole of astrophysics research. Honestly don't know what to write here so I'll let Samwise Gamgee from Lord of the Rings do the talking:
          </p>
          
          <div className={styles.divider} />
          
          <div className={`${styles.quote} ${showFullText ? styles.expanded : ''}`}>
            <p className={styles.quoteLine}>
              <span className={styles.speaker}>Frodo:</span> "I can't do this, Sam."
            </p>
            <p className={styles.quoteLine}>
              <span className={styles.speaker}>Sam:</span> "I know. It's all wrong. By rights we shouldn't even be here. But we are. It's like in the great stories, Mr. Frodo. The ones that really mattered. Full of darkness and danger they were. And sometimes you didn't want to know the end. Because how could the end be happy? How could the world go back to the way it was when so much bad had happened?"
            </p>
            <p className={styles.quoteLine}>
              "But in the end, it's only a passing thing, this shadow. Even darkness must pass. A new day will come. And when the sun shines it will shine out the clearer. Those were the stories that stayed with you. That meant something, even if you were too small to understand why. But I think, Mr. Frodo, I do understand. I know now. Folk in those stories had lots of chances of turning back only they didn't. They kept going because they were holding on to something."
            </p>
            <p className={styles.quoteLine}>
              <span className={styles.speaker}>Frodo:</span> "What are we holding on to, Sam?"
            </p>
            <p className={styles.quoteLine}>
              <span className={styles.speaker}>Sam:</span> "That there's some good in this world, Mr. Frodo. And it's worth fighting for."
            </p>
          </div>
          
          {!showFullText && (
            <button 
              className={styles.readMore}
              onClick={() => setShowFullText(true)}
            >
              Read more...
            </button>
          )}
          
          <a 
            href="https://wa.me/23057060025"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactButton}
          >
            Contact Me
          </a>
        </div>
      </main>
    </div>
  )
}

export default AboutPage
