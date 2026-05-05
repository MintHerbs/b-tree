// ERD Step 1 - User describes their ER scenario
import { motion } from 'motion/react'
import { ScrambleText } from '../animated-text'
import PillInput from '../PillInput/PillInput'
import PaginationDots from '../PaginationDots/PaginationDots'
import styles from './ERDStep1.module.css'

function ERDStep1({ initialQuestion, onSubmit, onAIStateChange, currentStep, totalSteps }) {
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className={styles.title}>
        <ScrambleText duration={500} speed={40}>
          ER Diagram Builder
        </ScrambleText>
      </h1>
      <p className={styles.subtitle}>
        <ScrambleText duration={500} speed={40}>
          describe your scenario below
        </ScrambleText>
      </p>
      <PillInput
        activeTool="erd"
        onSubmit={onSubmit}
        onAIStateChange={onAIStateChange}
        placeholder="e.g. A university has students who enroll in courses taught by professors..."
        defaultValue={initialQuestion}
      />
      <PaginationDots total={totalSteps} current={currentStep} />
    </motion.div>
  )
}

export default ERDStep1
