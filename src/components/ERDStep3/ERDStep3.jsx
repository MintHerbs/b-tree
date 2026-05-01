// ERD Step 3 - User pastes JSON from LLM
import PillInput from '../PillInput/PillInput'
import styles from './ERDStep3.module.css'

function ERDStep3({ onSubmit, onBack, error }) {
  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        ← Back
      </button>
      
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
    </div>
  )
}

export default ERDStep3
