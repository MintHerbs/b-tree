// ERD Step 1 - User describes their ER scenario
import PillInput from '../PillInput/PillInput'
import PaginationDots from '../PaginationDots/PaginationDots'
import styles from './ERDStep1.module.css'

function ERDStep1({ initialQuestion, onSubmit, onAIStateChange, currentStep, totalSteps }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ER Diagram Builder</h1>
      <p className={styles.subtitle}>describe your scenario below</p>
      <PillInput
        activeTool="erd"
        onSubmit={onSubmit}
        onAIStateChange={onAIStateChange}
        placeholder="e.g. A university has students who enroll in courses taught by professors..."
        defaultValue={initialQuestion}
      />
      <PaginationDots total={totalSteps} current={currentStep} />
    </div>
  )
}

export default ERDStep1
