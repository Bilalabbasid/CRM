declare type InventoryItem = {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
  lowStockThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
};

declare class ApiService {
  setToken(token: string | null): void;
  login(email: string, password: string): Promise<unknown>;
  register(data: unknown): Promise<unknown>;
  getCurrentUser(): Promise<unknown>;
  getInventory(params?: Record<string, unknown>): Promise<InventoryItem[]>;
  createInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem>;
  updateInventoryItem(id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<unknown>;
  getTopPerformers?: (params?: { dateFrom?: string; dateTo?: string; limit?: number }) => Promise<{
    period: { from: string; to: string };
    topSelling: Array<any>;
    leastSelling: Array<any>;
  }>;
  getTrends?: (params?: { dateFrom?: string; dateTo?: string }) => Promise<{
    period: { from: string; to: string };
    salesByHour: Array<{ _id: number; totalRevenue: number; orders: number }>;
    lunch: { _id: string; totalRevenue: number; orders: number };
    dinner: { _id: string; totalRevenue: number; orders: number };
    promotions: Array<any>;
  }>;
  getStockLevels?: () => Promise<Array<Partial<InventoryItem & { critical?: boolean }>>>;
  getLowStock?: () => Promise<Array<Partial<InventoryItem>>>;
  getFastSlow?: (params?: { days?: number }) => Promise<{ periodDays: number; fast: Array<any>; slow: Array<any> }>;
  getWastage?: (params?: { days?: number }) => Promise<{ expired: Array<any>; unsold: Array<any>; periodDays: number }>;
  getSupplierStatus?: () => Promise<{ source: string; orders?: Array<any>; items?: Array<any> }>;
}

declare const api: ApiService;
export default api;
declare const apiService: {
  request: (endpoint: string, options?: unknown) => Promise<unknown>;
  login: (credentials: { email: string; password: string }) => Promise<unknown>;
  register: (data: unknown) => Promise<unknown>;
  getCurrentUser: () => Promise<unknown>;
  getCustomers: (params?: unknown) => Promise<unknown>;
  createCustomer: (data: unknown) => Promise<unknown>;
  updateCustomer: (id: string, data: unknown) => Promise<unknown>;
  deleteCustomer: (id: string) => Promise<unknown>;
  getReservations: (params?: unknown) => Promise<unknown>;
  getOrders: (params?: unknown) => Promise<unknown>;
  getMenuItems: (params?: unknown) => Promise<unknown>;
  [key: string]: unknown;
};

export default apiService;
