import React from 'react';

type KPICardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, color = 'bg-white' }) => {
  return (
    <div className={`p-4 rounded shadow-sm ${color}`}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
};

export default KPICard;
