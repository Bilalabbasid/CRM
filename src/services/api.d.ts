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
