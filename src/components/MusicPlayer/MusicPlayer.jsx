import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import styles from './MusicPlayer.module.css'

const MusicPlayer = forwardRef((props, ref) => {
  const playerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play: () => {
      playerRef.current?.playVideo()
    },
    pause: () => {
      playerRef.current?.pauseVideo()
    }
  }))

  useEffect(() => {
    // Only inject script once globally
    if (!window.YT && !document.getElementById('yt-api-script')) {
      const script = document.createElement('script')
      script.id = 'yt-api-script'
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: 'wjJ3-SzxhCk',
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: 'wjJ3-SzxhCk',
          controls: 0,
          mute: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (e) => e.target.playVideo()
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [])

  return <div id="yt-player" className={styles.hidden} />
})

MusicPlayer.displayName = 'MusicPlayer'

export default MusicPlayer
