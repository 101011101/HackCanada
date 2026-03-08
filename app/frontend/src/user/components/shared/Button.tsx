import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}

export default function Button({ variant, size, fullWidth, icon, disabled, onClick, type = 'button', children }: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size && size !== 'md' ? `btn--${size}` : '',
    fullWidth ? 'btn--full' : '',
    icon ? 'btn--icon' : '',
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      whileHover={!disabled ? { opacity: 0.92 } : {}}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.button>
  );
}
