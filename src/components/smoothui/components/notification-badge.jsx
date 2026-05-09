import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

const positionClasses = {
  "top-right": "-top-1 -right-1",
  "top-left": "-top-1 -left-1",
  "bottom-right": "-bottom-1 -right-1",
  "bottom-left": "-bottom-1 -left-1",
};

const AnimatedCount = ({ value, max, shouldReduceMotion }) => {
  const displayValue = value > max ? `${max}+` : value.toString();
  const prevValueRef = useRef(value);
  const direction = value > prevValueRef.current ? 1 : -1;

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  if (shouldReduceMotion) {
    return <span className="font-medium leading-none">{displayValue}</span>;
  }

  return (
    <span className="relative overflow-hidden font-medium leading-none">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          className="inline-block"
          exit={{ y: direction * -12, opacity: 0 }}
          initial={{ y: direction * 12, opacity: 0 }}
          key={value}
          transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const NotificationBadge = ({
  variant = "dot",
  count = 0,
  max = 99,
  status = "online",
  showZero = false,
  ping = false,
  position = "top-right",
  children,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shouldShow =
      variant === "dot" ||
      variant === "status" ||
      (variant === "count" && (count > 0 || showZero));
    setIsVisible(shouldShow);
  }, [variant, count, showZero]);

  const getBadgeStyle = () => {
    const base = {
      minWidth: '16px',
      height: '16px',
      borderRadius: '999px',
      fontSize: '9px',
      fontWeight: '700',
      padding: '0 4px',
      lineHeight: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    return base;
  };

  const badgeElement = (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "text-white",
            variant === "status" && "ring-2 ring-white dark:ring-gray-900",
            className
          )}
          style={{
            ...getBadgeStyle(),
            backgroundColor: variant !== "status" ? "var(--color-accent)" : undefined,
            position: 'absolute',
            top: '-4px',
            right: '-4px',
          }}
          exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
          initial={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", duration: 0.25, bounce: 0.2 }}
        >
          {variant === "count" && (
            <AnimatedCount
              max={max}
              shouldReduceMotion={shouldReduceMotion}
              value={count}
            />
          )}
          {ping && !shouldReduceMotion && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '0',
                borderRadius: '999px',
                opacity: '0.75',
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                backgroundColor: variant !== "status" ? "var(--color-accent)" : undefined,
              }}
            />
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (!children) {
    return (
      <span className="relative inline-flex">
        <span className="h-4 w-4" />
        {badgeElement}
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      {children}
      {badgeElement}
    </span>
  );
};

export default NotificationBadge;
