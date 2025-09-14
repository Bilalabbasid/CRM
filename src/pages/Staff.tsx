import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface StaffMember {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const Staff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await apiService.getStaff({ limit: 100 });
      const list = res.staff || res || [];
      setStaff(list);
    } catch (err) {
      console.error('Error fetching staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-gray-600 dark:text-gray-400">Team members</p>
        </div>
        <Button onClick={fetchStaff}>Refresh</Button>
      </div>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Staff</h2></CardHeader>
        <CardContent>
          {loading ? <div>Loading…</div> : (
            <ul className="space-y-2">
              {staff.map((s: StaffMember, i) => (
                <li key={s._id || s.id || i} className="p-3 border rounded">{s.name || s.email || '—'}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Staff;
