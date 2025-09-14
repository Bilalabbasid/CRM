import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  hoverable = false,
  variant = 'default'
}) => {
  const baseClasses = "bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200";
  
  const variantClasses = {
    default: "shadow-md border-gray-100 dark:border-gray-700",
    elevated: "shadow-lg border-gray-100 dark:border-gray-700",
    outlined: "shadow-sm border-gray-200 dark:border-gray-600"
  };

  const interactiveClasses = onClick || hoverable 
    ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
    : "";

  const hoverClasses = hoverable && !onClick 
    ? "hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-600"
    : "";

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '',
  gradient = false
}) => {
  const gradientClasses = gradient 
    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
    : "bg-gray-50 dark:bg-gray-700";

  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-600 rounded-t-xl ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};