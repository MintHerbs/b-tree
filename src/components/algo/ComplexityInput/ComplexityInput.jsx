import { useState } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import styles from './ComplexityInput.module.css';

export default function ComplexityInput({ onSubmit, onAIStateChange }) {
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    setCode(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onAIStateChange) {
      onAIStateChange('observing');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onAIStateChange) {
      onAIStateChange('idle');
    }
  };

  const handleSubmit = () => {
    if (code.trim().length === 0) return;
    
    if (onAIStateChange) {
      onAIStateChange('thinking');
    }
    
    setTimeout(() => {
      onSubmit(code.trim());
    }, 120);
  };

  const handleKeyDown = (e) => {
    // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = code.trim().length > 0;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Code2 className={styles.icon} size={20} />
        <h2 className={styles.title}>O Complexity Analyser</h2>
      </div>
      
      <p className={styles.subtitle}>
        Paste a Python code block and get a step-by-step Big-O breakdown.
      </p>
      
      <div className={`${styles.pill} ${isFocused ? styles.focused : ''}`}>
        <textarea
          className={styles.textarea}
          placeholder="def example(n):&#10;    for i in range(n):&#10;        for j in range(n):&#10;            print(i, j)"
          value={code}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        
        <div className={styles.footer}>
          <span className={styles.hint}>
            {shortcutKey} Enter to analyse
          </span>
          
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!hasContent}
            type="button"
          >
            <ArrowRight size={16} />
            <span>Analyse</span>
          </button>
        </div>
      </div>
    </div>
  );
}
