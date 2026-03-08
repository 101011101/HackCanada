import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  variant: 'success' | 'error' | 'info' | 'accent';
  children: ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  const isPriority = variant === 'error' || variant === 'accent';

  return (
    <motion.span
      className={`badge badge--${variant}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isPriority
        ? { opacity: [1, 0.65, 1], scale: 1 }
        : { opacity: 1, scale: 1 }
      }
      transition={isPriority
        ? { opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.2 } }
        : { duration: 0.2 }
      }
    >
      {children}
    </motion.span>
  );
}
