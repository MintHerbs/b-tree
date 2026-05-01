// ER Diagram Builder page - 4-step paginated flow
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

function ERDPage() {
  const location = useLocation()
  const navigate = useNavigate()
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

  // Previous button - go back one step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
      setError(false)
    }
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
      
      {/* Sidebar - z-index: 10 */}
      <Sidebar 
        activeTool="erd"
        onToolChange={handleToolChange}
      />
      
      {/* Navbar */}
      <Navbar />
      
      {/* Main content */}
      <main className={styles.erdMain}>
        {/* Previous button - show on steps 2, 3, 4 */}
        {step > 1 && (
          <button className={styles.previousButton} onClick={handlePrevious}>
            Previous
          </button>
        )}
        
        {/* Reset button - only show on step 4 (canvas view) */}
        {step === 4 && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset ERD
          </button>
        )}
        
        {/* Step 1: User describes scenario */}
        {step === 1 && (
          <ERDStep1 
            initialQuestion={initialQuestion}
            onSubmit={handleStep1Submit}
            currentStep={initialQuestion ? step - 1 : step}
            totalSteps={initialQuestion ? 3 : 4}
          />
        )}
        
        {/* Step 2: Generated prompt + copy */}
        {step === 2 && (
          <ERDStep2 
            prompt={prompt}
            onNext={handleStep2Next}
            currentStep={initialQuestion ? step - 1 : step}
            totalSteps={initialQuestion ? 3 : 4}
          />
        )}
        
        {/* Step 3: Paste JSON */}
        {step === 3 && (
          <ERDStep3 
            onSubmit={handleStep3Submit}
            error={error}
            currentStep={initialQuestion ? step - 1 : step}
            totalSteps={initialQuestion ? 3 : 4}
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
