import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import RichTooltip, { YouTubeIcon, InstagramIcon, LinkedInIcon } from '../../components/ui/smoothui/rich-popover/index.tsx';
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

const SOCIAL_DEMOS = [
  {
    platform: 'youtube',
    icon: <YouTubeIcon />,
    triggerLabel: 'YouTube',
    title: 'Codex on YouTube',
    description: 'Video walkthroughs of B+ trees, ER diagrams, logic proofs, and more.',
    meta: '12 videos',
    actionLabel: 'Watch now',
    href: 'https://youtube.com',
  },
  {
    platform: 'instagram',
    icon: <InstagramIcon />,
    triggerLabel: 'Instagram',
    title: '@codex.dev',
    description: 'Visual breakdowns, cheat sheets, and study tips posted weekly.',
    meta: '2.4k followers',
    actionLabel: 'Follow',
    href: 'https://instagram.com',
  },
  {
    platform: 'linkedin',
    icon: <LinkedInIcon />,
    triggerLabel: 'LinkedIn',
    title: 'Codex on LinkedIn',
    description: 'Project updates, contributor spotlights, and open-source news.',
    meta: '850 connections',
    actionLabel: 'Connect',
    href: 'https://linkedin.com',
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Find us online</h2>
        <p className={styles.sectionSubtitle}>
          Click a link to see where we post content.
        </p>
        <div className={styles.socialRow}>
          {SOCIAL_DEMOS.map(item => (
            <RichTooltip
              key={item.platform}
              platform={item.platform}
              title={item.title}
              description={item.description}
              meta={item.meta}
              actionLabel={item.actionLabel}
              actionHref={item.href}
              href={item.href}
              side="top"
              align="center"
              trigger={
                <button className={styles.socialTrigger} type="button">
                  {item.icon}
                  <span>{item.triggerLabel}</span>
                </button>
              }
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
