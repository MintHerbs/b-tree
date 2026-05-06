// TranslatePage - English to Logic translation tool
import { useState } from 'react'
import LogicInputPage from '../../components/logic/LogicInputPage'
import TranslationResult from '../../components/logic/TranslationResult'
import Starfield from '../../components/Starfield/Starfield'
import Navbar from '../../components/Navbar/Navbar'
import { buildTranslatePrompt } from '../../lib/logic/logicPromptBuilder'
import { parseTranslation } from '../../lib/logic/logicParser'
import { callGeminiWithParser } from '../../lib/geminiService'
import styles from './TranslatePage.module.css'

export default function TranslatePage({ onAIStateChange }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAIStateChange = (state) => {
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange(state)
  }

  const handleSubmit = async (englishSentence) => {
    if (!englishSentence || englishSentence.trim().length === 0) {
      return
    }

    // Reset state
    setResult(null)
    setError(null)
    setIsLoading(true)
    if (typeof onAIStateChange !== 'function') return
    onAIStateChange('waiting')

    try {
      // Build prompt
      const prompt = buildTranslatePrompt(englishSentence)

      // Call Gemini API
      const response = await callGeminiWithParser(prompt, parseTranslation)

      if (response.success) {
        setResult(response.data)
        setError(null)
        // Set to idle after a brief moment
        if (typeof onAIStateChange === 'function') {
          setTimeout(() => onAIStateChange('idle'), 1000)
        }
      } else {
        setError(response.error)
        setResult(null)
        if (typeof onAIStateChange === 'function') {
          onAIStateChange('idle')
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
      setResult(null)
      if (typeof onAIStateChange === 'function') {
        onAIStateChange('idle')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // If we have a result, show it
  if (result) {
    return (
      <div className={styles.page}>
        <Starfield />
        <Navbar />
        <main className={styles.main}>
          <TranslationResult
            english={result.english}
            formal={result.formal}
            breakdown={result.breakdown}
          />
          <button
            className={styles.backButton}
            onClick={() => {
              setResult(null)
              if (typeof onAIStateChange === 'function') {
                onAIStateChange('idle')
              }
            }}
          >
            ← Translate Another
          </button>
        </main>
      </div>
    )
  }

  // If there's an error, show it
  if (error) {
    return (
      <div className={styles.page}>
        <Starfield />
        <Navbar />
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>Error</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.backButton}
              onClick={() => {
                setError(null)
                if (typeof onAIStateChange === 'function') {
                  onAIStateChange('idle')
                }
              }}
            >
              ← Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Otherwise show input page
  return (
    <LogicInputPage
      title="English to Logic"
      subtitle="Enter an English sentence to translate into formal logic notation"
      placeholder="If it rains then the ground is wet"
      onSubmit={handleSubmit}
      onAIStateChange={handleAIStateChange}
    />
  )
}
