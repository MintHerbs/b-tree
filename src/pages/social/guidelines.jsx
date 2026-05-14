import { useNavigate } from 'react-router-dom'
import Starfield from '../../components/effects/Starfield/Starfield'
import Navbar from '../../components/layout/Navbar/Navbar'

export default function GuidelinesPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingLeft: 56 }}>
      <Starfield />
      <Navbar
        showNewFormula={true}
        onNewFormula={() => navigate(-1)}
        newFormulaText="← Back"
        showAbout={false}
        showDisclaimer={false}
      />

      <main style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '18px 18px 60px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 18,
            padding: 18,
            color: 'rgba(255, 255, 255, 0.88)',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 10, color: 'rgba(255, 255, 255, 0.95)' }}>Community Guidelines</h1>

          <p style={{ fontSize: 13, lineHeight: '20px', marginBottom: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
            This feed is anonymous. Keep it respectful and useful.
          </p>

          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: '20px', marginBottom: 14 }}>
            <li>No harassment, hate, or personal attacks.</li>
            <li>No spam, flooding, or bot-like posting.</li>
            <li>No sharing private information (yours or someone else’s).</li>
            <li>Keep posts constructive and relevant to learning.</li>
          </ul>

          <h2 style={{ fontSize: 15, margin: '16px 0 8px', color: 'rgba(255, 255, 255, 0.95)' }}>Flag system</h2>
          <p style={{ fontSize: 13, lineHeight: '20px', color: 'rgba(255, 255, 255, 0.75)' }}>
            Use the flag button to report harmful or spammy content. If 10 people flag a post, it is removed for review.
          </p>
        </div>
      </main>
    </div>
  )
}

