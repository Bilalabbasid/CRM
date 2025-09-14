import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Order {
  _id?: string;
  id?: string;
  orderNumber?: number | string;
  status?: string;
  total?: number;
  total_amount?: number;
  items?: { name?: string; qty?: number }[];
  created_at?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiService.getOrders({ limit: 100 });
      const list = res.orders || res || [];
      const dummy = [
        { _id: 'o1', orderNumber: 1001, status: 'Preparing', total: 34.5, items: [{name: 'Margherita Pizza', qty:1}] },
        { _id: 'o2', orderNumber: 1002, status: 'Completed', total: 18.0, items: [{name: 'Grilled Salmon', qty:1}] },
        { _id: 'o3', orderNumber: 1003, status: 'Pending', total: 12.5, items: [{name: 'Craft Beer', qty:2}] }
      ];
  const effective = (Array.isArray(list) && list.length > 0) ? list as Order[] : dummy as Order[];
  setOrders(effective);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Recent orders</p>
        </div>
        <Button onClick={fetchOrders}>Refresh</Button>
      </div>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Orders</h2></CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : (
            <ul className="space-y-2">
              {orders.map((ord, i) => {
                const key = ord._id || ord.id || i;
                const orderNumber = ord.orderNumber ?? ord.id ?? i;
                const status = ord.status ?? '—';
                return (
                <li key={String(key)} className="p-3 border rounded">Order #{orderNumber} — {status}</li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
