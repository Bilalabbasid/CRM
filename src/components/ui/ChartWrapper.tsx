import React from 'react';

type ChartWrapperProps = {
  title?: string;
  children: React.ReactNode;
};

export const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow-sm">
      {title && <div className="text-sm text-gray-600 mb-2">{title}</div>}
      <div style={{ minHeight: 200 }}>{children}</div>
    </div>
  );
};

export default ChartWrapper;
