// ERD Step 3 - User pastes JSON from LLM
import PillInput from '../PillInput/PillInput'
import PaginationDots from '../PaginationDots/PaginationDots'
import styles from './ERDStep3.module.css'

function ERDStep3({ onSubmit, error, currentStep, totalSteps }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Paste the JSON</h1>
      <p className={styles.subtitle}>paste the JSON your LLM returned</p>
      
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
    </div>
  )
}

export default ERDStep3
