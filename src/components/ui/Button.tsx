import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClass = variant === 'primary' ? 'btn btn-primary' : variant === 'secondary' ? 'btn btn-ghost' : variant === 'danger' ? 'btn btn-error' : variant === 'success' ? 'btn btn-success' : 'btn btn-warning';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};