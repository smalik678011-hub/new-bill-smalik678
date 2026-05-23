import React from 'react';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padded?: boolean;
  hoverable?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padded = true,
  hoverable = false,
  interactive = false,
  className = '',
  id,
  onClick,
  ...props
}) => {
  const Component = interactive || onClick ? motion.div : 'div';
  
  const cardStyles = `
    bg-white dark:bg-slate-900 
    border border-slate-200/80 dark:border-slate-800/80 
    rounded-2xl transition-all duration-200
    ${padded ? 'p-4 sm:p-5' : ''}
    ${hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : 'shadow-xs'}
    ${interactive || onClick ? 'cursor-pointer active:scale-99' : ''}
    ${className}
  `;

  if (interactive || onClick) {
    return (
      <motion.div
        id={id}
        whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
        whileTap={{ scale: 0.985 }}
        onClick={onClick}
        className={cardStyles}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div id={id} className={cardStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;
