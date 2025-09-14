import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Card, CardContent } from '../components/ui/Card';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'branches', label: 'Branches' },
  { id: 'financials', label: 'Financials' },
  { id: 'customers', label: 'Customers' },
  { id: 'menu', label: 'Menu Insights' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'staff', label: 'Staff' },
  { id: 'risk', label: 'Risk' },
  { id: 'forecasts', label: 'Forecasts' }
];

export const Reports: React.FC = () => {
  const { profile } = useAuth();
  const [active, setActive] = useState<string>('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!profile || !(profile.role === 'admin' || profile.role === 'owner')) return;
      setLoading(true);
      setError(null);
      try {
        const svc = apiService as any;
        let resp;
        switch (active) {
          case 'overview':
            resp = await svc.getOwnerOverview();
            break;
          case 'branches':
            resp = await svc.getOwnerBranches();
            break;
          case 'financials':
            resp = await svc.getOwnerFinancials();
            break;
          case 'customers':
            resp = await svc.getOwnerCustomers();
            break;
          case 'menu':
            resp = await svc.getOwnerMenuInsights();
            break;
          case 'marketing':
            resp = await svc.getOwnerMarketing();
            break;
          case 'staff':
            resp = await svc.getOwnerStaff();
            break;
          case 'risk':
            resp = await svc.getOwnerRisk();
            break;
          case 'forecasts':
            resp = await svc.getOwnerForecasts();
            break;
          default:
            resp = null;
        }
        setData(resp?.data || resp || null);
      } catch (err: any) {
        console.warn('reports load error', err);
        setError(err?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [active, profile]);

  if (!profile || !(profile.role === 'admin' || profile.role === 'owner')) {
    return (
      <Card>
        <div className="p-6">You do not have access to reports.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-gray-600">Owner & Executive reports</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-1 rounded ${active === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-red-600">{error}</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-4">
                <h3 className="font-semibold">Raw Response</h3>
                <pre className="text-xs mt-2 max-h-64 overflow-auto bg-gray-50 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <h3 className="font-semibold">Summary</h3>
                <div className="mt-2">
                  {active === 'forecasts' && data ? (
                    <div>
                      <div className="text-sm text-gray-600">Average Daily Revenue (90d)</div>
                      <div className="text-xl font-bold">${(data as any)?.avgDaily ?? '—'}</div>
                      <div className="mt-3 text-sm text-gray-600">Next 30 days (forecast)</div>
                      <ul className="mt-2 text-sm max-h-48 overflow-auto list-decimal list-inside">
                        {Array.isArray((data as any)?.next30) && (data as any).next30.length > 0 ? (data as any).next30.map((d: any, i: number) => (
                          <li key={i}>Day {d.day}: ${d.forecast}</li>
                        )) : <li>No forecast data</li>}
                      </ul>
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-700">{data ? 'Data loaded — inspect Raw Response' : 'No data available'}</pre>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
