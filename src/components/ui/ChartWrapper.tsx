import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './Card';
import { Download, Maximize2, Minimize2, RefreshCw, Filter } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  onExport?: () => void;
  onRefresh?: () => void;
  onFilter?: () => void;
  expandable?: boolean;
  refreshable?: boolean;
  exportable?: boolean;
  filterable?: boolean;
  height?: number;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  error,
  className = '',
  onExport,
  onRefresh,
  onFilter,
  expandable = false,
  refreshable = false,
  exportable = false,
  filterable = false,
  height = 300
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const handleFilter = () => {
    if (onFilter) {
      onFilter();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const actionButtons = (
    <div className="flex items-center gap-2">
      {filterable && (
        <button
          onClick={handleFilter}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Filter data"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
      
      {refreshable && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
      
      {exportable && (
        <button
          onClick={handleExport}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Export chart"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
      
      {expandable && (
        <button
          onClick={toggleExpanded}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className={className} variant="elevated">
        <CardHeader gradient>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              {subtitle && (
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              )}
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
            style={{ height: `${height}px` }}
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className} variant="outlined">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
            {actionButtons}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Chart Error</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              {refreshable && (
                <button
                  onClick={handleRefresh}
                  className="mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${className} ${isExpanded ? 'fixed inset-4 z-50' : ''} transition-all duration-300`}
      variant="elevated"
    >
      <CardHeader gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actionButtons}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {isRefreshing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          </div>
        )}
        
        <div 
          className="w-full"
          style={{ 
            height: isExpanded ? 'calc(100vh - 200px)' : `${height}px`,
            minHeight: isExpanded ? '400px' : 'auto'
          }}
        >
          {children}
        </div>
      </CardContent>
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={toggleExpanded}
        />
      )}
    </Card>
  );
};

export default ChartWrapper;
