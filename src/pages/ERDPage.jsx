// ER Diagram Builder page - 4-step paginated flow
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Starfield from '../components/Starfield/Starfield'
import Navbar from '../components/Navbar/Navbar'
import PaginationDots from '../components/PaginationDots/PaginationDots'
import ERDStep1 from '../components/ERDStep1/ERDStep1'
import ERDStep2 from '../components/ERDStep2/ERDStep2'
import ERDStep3 from '../components/ERDStep3/ERDStep3'
import ERDCanvas from '../components/ERDCanvas/ERDCanvas'
import { buildERDPrompt } from '../lib/erdPromptBuilder'
import { parseERD } from '../lib/erdParser'
import styles from './ERDPage.module.css'

function ERDPage() {
  const location = useLocation()
  const initialQuestion = location.state?.question || ''
  
  // If question provided, skip to step 2; otherwise start at step 1
  const [step, setStep] = useState(initialQuestion ? 2 : 1)
  const [question, setQuestion] = useState(initialQuestion)
  const [prompt, setPrompt] = useState('')
  const [parsedERD, setParsedERD] = useState(null)
  const [error, setError] = useState(false)

  // On mount, if question exists, generate prompt automatically
  useEffect(() => {
    if (initialQuestion) {
      const generatedPrompt = buildERDPrompt(initialQuestion)
      setPrompt(generatedPrompt)
    }
  }, [initialQuestion])

  // Step 1: User submits question
  const handleStep1Submit = (value) => {
    setQuestion(value)
    const generatedPrompt = buildERDPrompt(value)
    setPrompt(generatedPrompt)
    setStep(2)
  }

  // Step 2: User clicks Next
  const handleStep2Next = () => {
    setStep(3)
  }

  // Step 3: User pastes JSON
  const handleStep3Submit = (value) => {
    // Use erdParser to validate
    const result = parseERD(value)
    
    if (result.valid) {
      // Store parsed data and advance to step 4
      setParsedERD(result.data)
      setError(false)
      setStep(4)
    } else {
      // Show error
      setError(true)
    }
  }

  // Step 3: Back button
  const handleStep3Back = () => {
    setError(false)
    setStep(2)
  }

  // Reset ERD flow
  const handleReset = () => {
    setStep(1)
    setQuestion('')
    setPrompt('')
    setParsedERD(null)
    setError(false)
  }

  return (
    <div className={styles.erdPage}>
      {/* Starfield background - z-index: 0 */}
      <Starfield />
      
      {/* Navbar - landing page style (About link only) */}
      <Navbar />
      
      {/* Main content */}
      <main className={styles.erdMain}>
        {/* Reset button - only show on step 4 (canvas view) */}
        {step === 4 && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset ERD
          </button>
        )}
        
        {/* Show 3 dots when skipping step 1, 4 dots when starting from step 1 */}
        <PaginationDots total={initialQuestion ? 3 : 4} current={initialQuestion ? step - 1 : step} />
        
        {/* Step 1: User describes scenario */}
        {step === 1 && (
          <ERDStep1 
            initialQuestion={initialQuestion}
            onSubmit={handleStep1Submit}
          />
        )}
        
        {/* Step 2: Generated prompt + copy */}
        {step === 2 && (
          <ERDStep2 
            prompt={prompt}
            onNext={handleStep2Next}
          />
        )}
        
        {/* Step 3: Paste JSON */}
        {step === 3 && (
          <ERDStep3 
            onSubmit={handleStep3Submit}
            onBack={handleStep3Back}
            error={error}
          />
        )}
        
        {/* Step 4: Rendered diagram */}
        {step === 4 && (
          <ERDCanvas erdData={parsedERD} />
        )}
      </main>
    </div>
  )
}

export default ERDPage
