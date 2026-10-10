import type { Variants } from 'motion/react';

// Transition configurations
export const transitions = {
  snappy: { duration: 0.15, ease: 'easeInOut' as const },
  standard: { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const },
  cinematic: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  slow: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
};

// Reusable motion variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.standard },
  exit: { opacity: 0, y: -20, transition: transitions.snappy },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: transitions.standard },
  exit: { opacity: 0, y: 20, transition: transitions.snappy },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.standard },
  exit: { opacity: 0, transition: transitions.snappy },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.standard },
  exit: { opacity: 0, scale: 0.95, transition: transitions.snappy },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: transitions.cinematic },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: 'easeOut' } },
};
