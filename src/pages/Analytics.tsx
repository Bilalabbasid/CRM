import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Analytics: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiService.getDashboardReport();
      setReport(res);
    } catch (err) {
      console.error('Error fetching dashboard report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Key metrics</p>
        </div>
        <Button onClick={fetchReport}>Refresh</Button>
      </div>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Dashboard Report</h2></CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : <pre className="text-xs">{JSON.stringify(report, null, 2)}</pre>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
