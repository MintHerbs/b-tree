import { motion } from 'motion/react'
import { Lightbulb, Sparkles, Zap, Heart } from 'lucide-react'
import styles from './Callout.module.css'

const iconMap = {
  tip: Lightbulb,
  highlight: Sparkles,
  important: Zap,
  note: Heart,
}

export default function Callout({ 
  variant = 'tip', 
  title, 
  children,
  icon: CustomIcon,
  className = ''
}) {
  const Icon = CustomIcon || iconMap[variant] || Lightbulb

  return (
    <motion.div 
      className={`${styles.callout} ${styles[variant]} ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ 
        scale: 1.01,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}
    >
      <motion.div 
        className={styles.iconWrapper}
        animate={{ 
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Icon size={22} strokeWidth={2.5} />
      </motion.div>
      
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.body}>{children}</div>
      </div>
    </motion.div>
  )
}
