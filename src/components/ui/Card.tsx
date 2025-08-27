import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  hover = true
}) => {
  const baseClasses = 'bg-slc-white rounded-xl border transition-all duration-300';
  
  const variantClasses = {
    default: 'border-slc-light-gray shadow-lg',
    elevated: 'border-slc-light-gray shadow-xl',
    outlined: 'border-slc-bronze/30 shadow-md'
  };
  
  const hoverClasses = hover ? 'hover:shadow-2xl hover:border-slc-bronze/50 hover:scale-[1.02]' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${className}`;
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
