import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

type InventoryItem = {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
  lowStockThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
};

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: 0, unit: '', notes: '', lowStockThreshold: 5 });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getInventory();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const onAdd = async () => {
    try {
      const created = await api.createInventoryItem(form);
      setItems((s) => [created as InventoryItem, ...s]);
      setShowAdd(false);
      setForm({ name: '', quantity: 0, unit: '', notes: '', lowStockThreshold: 5 });
    } catch (err) {
      console.error('Create failed', err);
    }
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        {isManager && <Button onClick={() => setShowAdd(true)}>Add Item</Button>}
      </div>

      <Card>
        <CardHeader>
          <h3>Items</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {items.length === 0 && <div>No items found.</div>}
              {items.map((it) => {
                const low = it.quantity <= (it.lowStockThreshold ?? 5);
                return (
                  <div key={it._id} className={`flex items-center justify-between p-2 border rounded ${low ? 'border-red-300 bg-red-50' : ''}`}>
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground">{it.quantity} {it.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Threshold: {it.lowStockThreshold}</div>
                      {isManager && (
                        <div className="mt-2"><Button size="sm" onClick={() => {}}>Edit</Button></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

  <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Inventory Item">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Quantity" type="number" value={String(form.quantity)} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <Input label="Low stock threshold" type="number" value={String(form.lowStockThreshold)} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={onAdd}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
