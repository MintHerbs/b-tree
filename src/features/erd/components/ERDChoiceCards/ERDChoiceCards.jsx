import GlowHover from '../smoothui/glow-hover-card/index.tsx';
import styles from './ERDChoiceCards.module.css';

export default function ERDChoiceCards({ remainingCalls, onUseAI, onUseManual }) {
  const isOutOfCalls = remainingCalls === 0;

  const card1Description = isOutOfCalls
    ? "You're out of AI calls. Come back in 24 hours."
    : `You have ${remainingCalls} of 10 AI calls remaining. Calls reset every 24 hours. No setup needed.`;

  const items = [
    {
      id: 'built-in-ai',
      theme: { hue: 270, saturation: 70, lightness: 60 },
      element: (
        <div className={styles.card}>
          <img 
            src="/src/img/ai icons/gemini.svg" 
            alt="Gemini AI" 
            className={styles.icon}
          />
          <h3 className={styles.title}>Use Built-in AI</h3>
          <p className={styles.description}>{card1Description}</p>
          <button
            className={styles.button}
            onClick={onUseAI}
            disabled={isOutOfCalls}
          >
            {isOutOfCalls ? 'Out of Calls' : 'Generate with AI'}
          </button>
        </div>
      ),
    },
    {
      id: 'manual-api',
      theme: { hue: 200, saturation: 70, lightness: 60 },
      element: (
        <div className={styles.card}>
          <img 
            src="/src/img/ai icons/mi.svg" 
            alt="Manual API" 
            className={styles.icon}
          />
          <h3 className={styles.title}>I Have My Own API</h3>
          <p className={styles.description}>
            Copy the generated prompt into any LLM of your choice. Paste the JSON response back to generate your diagram.
          </p>
          <button
            className={styles.button}
            onClick={onUseManual}
          >
            Use My Own API
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <GlowHover items={items} className={styles.glowWrapper} />
    </div>
  );
}
