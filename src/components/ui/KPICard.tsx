import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../constants/design-system';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute' | 'currency';
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
  format?: 'currency' | 'number' | 'percentage' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'percentage',
  trend = 'neutral',
  icon,
  subtitle,
  onClick,
  loading = false,
  format = 'text',
  size = 'md'
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    const iconClass = "w-4 h-4";
    switch (trend) {
      case 'up':
        return <TrendingUp className={iconClass} />;
      case 'down':
        return <TrendingDown className={iconClass} />;
      default:
        return <Minus className={iconClass} />;
    }
  };

  const getBorderColor = () => {
    switch (trend) {
      case 'up':
        return 'border-l-green-500';
      case 'down':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const getBackgroundGradient = () => {
    switch (trend) {
      case 'up':
        return 'hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10';
      case 'down':
        return 'hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/10 dark:hover:to-rose-900/10';
      default:
        return 'hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10';
    }
  };

  const formatValue = (val: string | number) => {
    if (loading) return '---';
    
    const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
    
    switch (format) {
      case 'currency':
        return formatCurrency(numVal);
      case 'number':
        return formatNumber(numVal);
      case 'percentage':
        return formatPercentage(numVal);
      default:
        return val.toString();
    }
  };

  const formatChangeValue = () => {
    if (!change) return null;
    
    const prefix = change > 0 ? '+' : '';
    switch (changeType) {
      case 'currency':
        return `${prefix}${formatCurrency(change)}`;
      case 'absolute':
        return `${prefix}${formatNumber(change)}`;
      case 'percentage':
      default:
        return `${prefix}${change.toFixed(1)}%`;
    }
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className={sizeClasses[size]}>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-l-4 ${getBorderColor()} bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-all duration-300 ${getBackgroundGradient()}`}
      onClick={onClick}
      hoverable={!!onClick}
    >
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className={`font-medium text-gray-600 dark:text-gray-400 ${titleSizeClasses[size]}`}>
                {title}
              </p>
              {onClick && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <p className={`font-bold text-gray-900 dark:text-white ${valueSizeClasses[size]} mb-2`}>
              {formatValue(value)}
            </p>
            
            {(change !== undefined || subtitle) && (
              <div className="flex items-center gap-2">
                {change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{formatChangeValue()}</span>
                  </div>
                )}
                {subtitle && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {icon && (
            <div className={`flex-shrink-0 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 ${getTrendColor()}`}>
              {React.cloneElement(icon as React.ReactElement, { 
                className: size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
              })}
            </div>
          )}
        </div>
        
        {onClick && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
              <span>Click for details</span>
              <TrendingUp className="w-3 h-3 ml-1" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
