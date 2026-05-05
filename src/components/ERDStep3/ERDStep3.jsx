// ERD Step 3 - Paste JSON input
import { motion } from 'motion/react'
import { ScrambleText } from '../animated-text'
import PillInput from '../PillInput/PillInput'
import PaginationDots from '../PaginationDots/PaginationDots'
import styles from './ERDStep3.module.css'

function ERDStep3({ onSubmit, error, currentStep, totalSteps }) {
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className={styles.title}>
        <ScrambleText duration={500} speed={40}>
          Paste the JSON
        </ScrambleText>
      </h1>
      <p className={styles.subtitle}>
        <ScrambleText duration={500} speed={40}>
          paste the JSON your LLM returned
        </ScrambleText>
      </p>
      
      <PillInput
        activeTool="erd"
        onSubmit={onSubmit}
        placeholder="Paste your ERD JSON here..."
      />
      
      {error && (
        <p className={styles.error}>
          Invalid JSON — make sure you copied the full response
        </p>
      )}
      
      <PaginationDots total={totalSteps} current={currentStep} />
    </motion.div>
  )
}

export default ERDStep3
