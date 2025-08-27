import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-slc-bronze text-slc-white hover:bg-slc-bronze-alt focus:ring-slc-bronze hover:scale-105',
    secondary: 'bg-slc-dark text-slc-white hover:bg-slc-dark-alt focus:ring-slc-dark hover:scale-105',
    outline: 'bg-transparent text-slc-bronze border-2 border-slc-bronze hover:bg-slc-bronze hover:text-slc-white focus:ring-slc-bronze hover:scale-105',
    ghost: 'bg-transparent text-slc-bronze hover:bg-slc-bronze/10 focus:ring-slc-bronze hover:scale-105'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-md',
    lg: 'px-8 py-4 text-lg rounded-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
