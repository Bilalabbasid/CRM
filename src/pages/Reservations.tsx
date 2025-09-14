import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';

interface Reservation {
  _id?: string;
  id?: string;
  name?: string;
  customerName?: string;
  customer?: { name?: string };
  table?: string | number;
  tableNumber?: string | number;
  time?: string;
  reservationTime?: string;
  date?: string;
  partySize?: number;
  party?: number;
  status?: string;
}

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showDummyPreview, setShowDummyPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await apiService.getReservations({ limit: 100 });
      const list = res.reservations || res || [];
      const dummy = [
        { _id: 'r1', customerName: 'Alice Walker', table: '5', time: new Date().toISOString(), partySize: 4, status: 'Confirmed' },
        { _id: 'r2', customerName: 'Bob Martin', table: '2', time: new Date().toISOString(), partySize: 2, status: 'Cancelled' }
      ];
      const effective = (Array.isArray(list) && list.length > 0) ? list : dummy;
      setReservations(effective);
    } catch (err) {
      console.error('Error fetching reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-gray-600 dark:text-gray-400">List of reservations</p>
        </div>
  <div className="flex items-center space-x-2">
  <Button onClick={fetchReservations}>Refresh</Button>
  <Button variant="secondary" onClick={() => setShowDummyPreview(true)}>Preview Dummy</Button>
  </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservations</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton height="1.5rem" />
              <Skeleton height="1.5rem" />
              <Skeleton height="1.5rem" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left">#</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Table</th>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Party</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reservations.map((resItem: Reservation, i) => {
                  const r = resItem as Reservation;
                  const key = r._id || r.id || i;
                  const cust = r.customer as Record<string, unknown> | undefined;
                  const customerName = r.customerName || (cust && (cust.name as string)) || r.name || '—';
                  const table = String(r.table ?? r.tableNumber ?? '—');
                  const time = r.time || r.reservationTime || r.date || '—';
                  const party = r.partySize ?? r.party ?? '—';
                  const status = r.status || '—';
                  return (
                    <tr key={key}>
                      <td className="px-6 py-4">{i + 1}</td>
                      <td className="px-6 py-4">{customerName}</td>
                      <td className="px-6 py-4">{table}</td>
                      <td className="px-6 py-4">{time}</td>
                      <td className="px-6 py-4">{party}</td>
                      <td className="px-6 py-4">{status}</td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Modal isOpen={showDummyPreview} onClose={() => setShowDummyPreview(false)} title="Dummy Reservations Preview">
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={(r._id || r.id) as string} className="p-3 border rounded">
              <div className="text-sm font-medium">{(r.customerName as string) || ((r.customer as Record<string, unknown>)?.name as string) || 'Unknown'}</div>
              <div className="text-xs text-gray-500">Table: {String(r.table || r.tableNumber)} • Party: {String(r.partySize || r.party)}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;
