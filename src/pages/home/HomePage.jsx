import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import styles from './home.module.css';

const FACULTIES = [
  {
    acronym: 'IT',
    name: 'Information Technology',
    icon: '💻',
  },
  {
    acronym: 'Social Science',
    name: 'Social Sciences & Humanities',
    icon: '📚',
  },
  {
    acronym: 'Agricultural Science',
    name: 'Agricultural Science',
    icon: '🌾',
  },
  {
    acronym: 'Engineering',
    name: 'Engineering & Architecture',
    icon: '⚙️',
  },
];

export default function HomePage() {
  return (
    <PageShell variant="content">
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Codex</h1>
        <p className={styles.heroTagline}>
          A study companion built by students, for students.
        </p>
        <p className={styles.heroDescription}>
          Codex is an open-source toolkit of interactive visualizers, solvers,
          and notes for university coursework — B+ trees, ER diagrams, code
          complexity, logical proofs, recurrence relations, grade calculators,
          and more. Everything runs in your browser, nothing is tracked, and
          the source is yours to read, fork, and improve.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Browse by faculty</h2>
        <p className={styles.sectionSubtitle}>
          Pick your faculty to see the tools and notes relevant to your modules.
        </p>
        <div className={styles.facultyGrid}>
          {FACULTIES.map(f => (
            <Card
              key={f.acronym}
              title={f.acronym}
              description={f.name}
              icon={f.icon}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
