import styles from './Card.module.css';

export default function Card({
  title,
  description,
  icon,
  onClick,
  href,
  className = '',
  children,
  ...rest
}) {
  const isInteractive = Boolean(onClick || href);
  const classes = `${styles.card} ${isInteractive ? styles.interactive : ''} ${className}`.trim();

  const content = (
    <>
      {(icon || title) && (
        <div className={styles.header}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title && <h3 className={styles.title}>{title}</h3>}
        </div>
      )}
      {description && <p className={styles.description}>{description}</p>}
      {children && <div className={styles.body}>{children}</div>}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} {...rest}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} {...rest}>
      {content}
    </div>
  );
}
