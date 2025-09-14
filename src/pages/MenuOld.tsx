import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type MenuItem = Record<string, unknown>;

const MenuPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMenuItems({ limit: 100 });
      const list = res.menuItems || res || [];
      const dummy = [
        { _id: 'm1', name: 'Margherita Pizza', category: 'mains', price: 12.5, timesOrdered: 120 },
        { _id: 'm2', name: 'Grilled Salmon', category: 'mains', price: 18.0, timesOrdered: 75 },
        { _id: 'm3', name: 'Craft Beer Selection', category: 'beverages', price: 6.0, timesOrdered: 90 }
      ];
      const effective = (Array.isArray(list) && list.length > 0) ? list : dummy;
      setItems(effective);
    } catch (err) {
      console.error('Error fetching menu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
          <p className="text-gray-600 dark:text-gray-400">Menu items</p>
        </div>
        <Button onClick={fetchMenu}>Refresh</Button>
      </div>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Menu Items</h2></CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : (
            <ul className="space-y-2">
              {items.map((it: MenuItem, i) => {
                const item = it as Record<string, unknown>;
                const key = (item._id as string) || (item.id as string) || i;
                const name = (item.name as string) || (item.title as string) || 'Unnamed';
                return <li key={key} className="p-3 border rounded">{name}</li>;
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuPage;
