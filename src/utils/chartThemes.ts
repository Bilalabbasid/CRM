import { DESIGN_SYSTEM } from '../constants/design-system';

// Chart theme for consistent styling across all charts
export const getChartTheme = () => ({
  colors: DESIGN_SYSTEM.chartColors,
  grid: {
    stroke: DESIGN_SYSTEM.colors.gray[200],
    strokeDasharray: '3 3'
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#fff',
      border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
      borderRadius: DESIGN_SYSTEM.radius.md,
      boxShadow: DESIGN_SYSTEM.shadows.lg,
      fontSize: '14px'
    }
  },
  legend: {
    wrapperStyle: {
      fontSize: '12px',
      color: DESIGN_SYSTEM.colors.gray[600]
    }
  }
});

// Chart configuration presets
export const chartConfigs = {
  lineChart: {
    strokeWidth: 3,
    dot: { r: 4 },
    activeDot: { r: 6 }
  },
  barChart: {
    radius: [4, 4, 0, 0]
  },
  pieChart: {
    innerRadius: 60,
    outerRadius: 120,
    paddingAngle: 2
  }
};

// Custom chart colors for different data types
export const chartColorSets = {
  revenue: ['#3b82f6', '#10b981', '#f59e0b'],
  performance: ['#10b981', '#ef4444', '#6b7280'],
  categories: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  status: ['#10b981', '#f59e0b', '#ef4444'],
  trends: ['#3b82f6', '#10b981']
};

export default { getChartTheme, chartConfigs, chartColorSets };