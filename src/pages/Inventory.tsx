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

type FastSlowItem = { name?: string; qtySold?: number; menuItemId?: string; inventoryItemId?: string };
type FastSlowRes = { periodDays?: number; fast?: FastSlowItem[]; slow?: FastSlowItem[] };

type WastageItem = { name?: string; reason?: string; expiryDate?: string };
type WastageRes = { expired?: WastageItem[]; unsold?: WastageItem[]; periodDays?: number };

type SupplierOrder = { _id?: string; orderNumber?: string; name?: string; status?: string; state?: string };
type SupplierStatus = { source?: string; orders?: SupplierOrder[]; items?: SupplierOrder[] };

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockLevels, setStockLevels] = useState<Array<Partial<InventoryItem & { critical?: boolean }>>>([]);
  const [lowStockItems, setLowStockItems] = useState<Array<Partial<InventoryItem>>>([]);
  const [fastSlow, setFastSlow] = useState<FastSlowRes>({});
  const [wastage, setWastage] = useState<WastageRes>({});
  const [supplierStatus, setSupplierStatus] = useState<SupplierStatus>({});
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: 0, unit: '', notes: '', lowStockThreshold: 5 });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getInventory();
      setItems(Array.isArray(res) ? res : []);
      // load analytics
      try {
        if (api && api.getStockLevels) {
          const sl = await api.getStockLevels();
          setStockLevels(Array.isArray(sl) ? sl : []);
        }
      } catch (e) { console.warn('stockLevels fetch failed', e); }

      try {
        if (api && api.getLowStock) {
          const low = await api.getLowStock();
          setLowStockItems(Array.isArray(low) ? low : []);
        }
      } catch (e) { console.warn('lowStock fetch failed', e); }

      try {
        if (api && api.getFastSlow) {
          const fs = await api.getFastSlow({ days: 30 });
          setFastSlow(fs || {});
        }
      } catch (e) { console.warn('fastSlow fetch failed', e); }

      try {
        if (api && api.getWastage) {
          const w = await api.getWastage({ days: 30 });
          setWastage(w || {});
        }
      } catch (e) { console.warn('wastage fetch failed', e); }

      try {
        if (api && api.getSupplierStatus) {
          const s = await api.getSupplierStatus();
          setSupplierStatus(s || {});
        }
      } catch (e) { console.warn('supplierStatus fetch failed', e); }
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

      {/* Stock Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <h3>Stock Levels</h3>
          </CardHeader>
          <CardContent>
            {stockLevels.length === 0 ? <div className="text-sm text-gray-500">No data</div> : (
              <div className="space-y-2">
                {stockLevels.map(it => (
                  <div key={String(it._id)} className={`flex items-center justify-between p-2 border rounded ${it.critical ? 'border-red-300 bg-red-50' : ''}`}>
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground">{it.quantity} {it.unit}</div>
                    </div>
                    <div className="text-sm">Threshold: {it.lowStockThreshold}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3>Low Stock Alerts</h3>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? <div className="text-sm text-gray-500">No low stock alerts</div> : (
              <div className="space-y-2">
                {lowStockItems.map(it => (
                  <div key={it._id} className="flex items-center justify-between p-2 border rounded border-red-300 bg-red-50">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground">{it.quantity} {it.unit}</div>
                    </div>
                    <div className="text-sm text-red-600">Threshold: {it.lowStockThreshold}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fast / Slow movers & Wastage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader>
            <h3>Fast Movers (30d)</h3>
          </CardHeader>
          <CardContent>
            {(!fastSlow.fast || fastSlow.fast.length === 0) ? <div className="text-sm text-gray-500">No data</div> : (
              <div className="space-y-2">
                {fastSlow.fast.map((f: FastSlowItem | undefined, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>{f?.name ?? '—'}</div>
                    <div className="font-semibold">{f?.qtySold ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3>Slow Movers (30d)</h3>
          </CardHeader>
          <CardContent>
            {(!fastSlow.slow || fastSlow.slow.length === 0) ? <div className="text-sm text-gray-500">No data</div> : (
              <div className="space-y-2">
                {fastSlow.slow.map((s: FastSlowItem | undefined, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>{s?.name ?? '—'}</div>
                    <div className="text-sm text-gray-500">{s?.qtySold ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3>Wastage (Expired / Unsold)</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">Expired: {wastage.expired?.length ?? 0}</div>
              <div className="text-sm">Unsold (30d): {wastage.unsold?.length ?? 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Orders */}
      <Card className="mt-4">
        <CardHeader>
          <h3>Supplier Orders Status</h3>
        </CardHeader>
        <CardContent>
          {supplierStatus.source ? (
            <div>
              <div className="text-sm">Source: {supplierStatus.source}</div>
              <div className="mt-2 space-y-2">
                {(supplierStatus.orders || supplierStatus.items || []).slice(0,10).map((o: SupplierOrder | undefined, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="truncate">{o?.orderNumber || o?._id || o?.name || 'order'}</div>
                    <div className="text-sm text-gray-500">{o?.status || o?.state || 'unknown'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No supplier order data</div>
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
