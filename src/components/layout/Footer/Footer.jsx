/**
 * Footer — site footer for content pages.
 *
 * Renders the brand blurb, grouped navigation (tools + resources), and a
 * copyright line.
 *
 * Internal destinations use react-router <Link> so navigation stays
 * client-side; external destinations (GitHub, Contributors) are plain
 * anchors opened in a new tab.
 */
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const GITHUB_URL = 'https://github.com/MintHerbs/b-tree';
const CONTRIBUTORS_URL = 'https://github.com/MintHerbs/b-tree/graphs/contributors';

const TOOL_LINKS = [
  { label: 'CPA Calculator', to: '/tools/grade-toolkit' },
  { label: 'B+ Tree Visualizer', to: '/tree' },
  { label: 'ERD Visualizer', to: '/erd' },
  { label: 'Code Complexity', to: '/algo/code-complexity' },
  { label: 'Recurrence Relation', to: '/algo/recurrence-relation' },
];

const RESOURCE_LINKS = [
  { label: 'Community', to: '/social/feed' },
  { label: 'Guidelines', to: '/social/guidelines' },
  { label: 'Team', to: '/about' },
  { label: 'Disclaimer', to: '/disclaimer' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Night Vault</span>
          <p className={styles.brandBlurb}>
            A study companion built by students, for students. Open source and
            free to use.
          </p>
        </div>

        <nav className={styles.column} aria-label="Tools">
          <h2 className={styles.columnTitle}>Tools</h2>
          {TOOL_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} className={styles.link}>
              {label}
            </Link>
          ))}
        </nav>

        <nav className={styles.column} aria-label="Resources">
          <h2 className={styles.columnTitle}>Resources</h2>
          {RESOURCE_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} className={styles.link}>
              {label}
            </Link>
          ))}
          <a
            href={CONTRIBUTORS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Contributors
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            GitHub
          </a>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span className={styles.copyright}>
          © {year} Night Vault. Built by students, for students.
        </span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.copyright}
        >
          MIT Licensed
        </a>
      </div>
    </footer>
  );
}
