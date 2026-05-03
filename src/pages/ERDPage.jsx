// ER Diagram Builder page - 3-step paginated flow
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Starfield from '../components/Starfield/Starfield'
import Sidebar from '../components/Sidebar/Sidebar'
import Navbar from '../components/Navbar/Navbar'
import ERDStep1 from '../components/ERDStep1/ERDStep1'
import ERDStep2 from '../components/ERDStep2/ERDStep2'
import ERDStep3 from '../components/ERDStep3/ERDStep3'
import ERDCanvas from '../components/ERDCanvas/ERDCanvas'
import { buildERDPrompt } from '../lib/erdPromptBuilder'
import { parseERD } from '../lib/erdParser'
import styles from './ERDPage.module.css'

function ERDPage({ onAIStateChange }) {
  const location = useLocation()
  const navigate = useNavigate()
  const initialQuestion = location.state?.question || ''
  
  const [step, setStep] = useState(1)
  const [question, setQuestion] = useState(initialQuestion)
  const [prompt, setPrompt] = useState('')
  const [parsedERD, setParsedERD] = useState(null)
  const [error, setError] = useState(false)

  // Cleanup: set to 'idle' when leaving the page
  useEffect(() => {
    return () => {
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('idle')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If question provided from landing page, generate prompt and advance to step 2
  useEffect(() => {
    if (initialQuestion) {
      const generatedPrompt = buildERDPrompt(initialQuestion)
      setPrompt(generatedPrompt)
      setStep(2)
      // Transition to 'waiting' state when advancing to step 2
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('waiting')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  // Handle tool switching from sidebar
  const handleToolChange = (tool) => {
    if (tool === 'btree') {
      navigate('/')
    } else if (tool === 'calculator') {
      window.open('https://lazy-grades.vercel.app/', '_blank')
    }
  }

  // Step 1: User submits question
  const handleStep1Submit = (value) => {
    setQuestion(value)
    const generatedPrompt = buildERDPrompt(value)
    setPrompt(generatedPrompt)
    setStep(2)
    // Transition to 'waiting' state when advancing to step 2
    if (typeof onAIStateChange === 'function') {
      onAIStateChange('waiting')
    }
  }

  // Step 2: User copies prompt and advances to step 3
  const handleStep2Next = () => {
    setStep(3)
  }

  // Step 3: User pastes JSON
  const handleStep3Submit = (value) => {
    // Show 'thinking' state immediately (synchronously, before any setState)
    if (typeof onAIStateChange === 'function') {
      onAIStateChange('thinking')
    }
    
    // Use erdParser to validate
    const result = parseERD(value)
    
    if (result.valid) {
      // Store parsed data
      setParsedERD(result.data)
      setError(false)
      
      // After 3 seconds, collapse to 'idle'
      setTimeout(() => {
        if (typeof onAIStateChange === 'function') {
          onAIStateChange('idle')
        }
      }, 3000)
    } else {
      // Show error and reset to idle immediately
      setError(true)
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('idle')
      }
    }
  }

  // Previous button - go back one step
  const handlePrevious = () => {
    if (step === 2) {
      setStep(1)
      setError(false)
      // Back to observing state
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('observing')
      }
    } else if (step === 3) {
      setStep(2)
      setError(false)
      // Back to waiting state
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('waiting')
      }
    }
  }

  // Reset ERD flow
  const handleReset = () => {
    setStep(1)
    setQuestion('')
    setPrompt('')
    setParsedERD(null)
    setError(false)
    if (typeof onAIStateChange === 'function') {
      onAIStateChange('observing')
    }
  }

  return (
    <div className={styles.erdPage}>
      {/* Starfield background - z-index: 0 */}
      <Starfield />
      
      {/* Sidebar - z-index: 10 */}
      <Sidebar 
        activeTool="erd"
        onToolChange={handleToolChange}
      />
      
      {/* Navbar */}
      <Navbar />
      
      {/* Main content */}
      <main className={styles.erdMain}>
        {/* Previous button - show on steps 2 and 3 (before canvas renders) */}
        {(step === 2 || (step === 3 && !parsedERD)) && (
          <button className={styles.previousButton} onClick={handlePrevious}>
            Previous
          </button>
        )}
        
        {/* Reset button - only show when canvas is visible */}
        {parsedERD && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset ERD
          </button>
        )}
        
        {/* Step 1: User describes scenario */}
        {step === 1 && (
          <ERDStep1 
            initialQuestion={initialQuestion}
            onSubmit={handleStep1Submit}
            onAIStateChange={onAIStateChange}
            currentStep={1}
            totalSteps={3}
          />
        )}
        
        {/* Step 2: Copy prompt */}
        {step === 2 && (
          <ERDStep2 
            prompt={prompt}
            onNext={handleStep2Next}
            currentStep={2}
            totalSteps={3}
          />
        )}
        
        {/* Step 3: Paste JSON (before canvas renders) */}
        {step === 3 && !parsedERD && (
          <ERDStep3 
            onSubmit={handleStep3Submit}
            error={error}
            currentStep={3}
            totalSteps={3}
          />
        )}
        
        {/* Canvas: Rendered diagram (after JSON submission) */}
        {parsedERD && (
          <ERDCanvas erdData={parsedERD} />
        )}
      </main>
    </div>
  )
}

export default ERDPage
