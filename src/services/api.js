function computeApiBase() {
  // Vite env override
  if (import.meta?.env?.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location) {
    // Attempt to derive API URL from current origin by swapping port to backend port
    const url = new URL(window.location.href);
    // Default backend port
    const backendPort = import.meta?.env?.VITE_API_PORT || '5000';
    // If running on localhost, replace port with backendPort
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.port = backendPort;
      url.pathname = '/api';
      return url.origin + url.pathname;
    }
  }

  // Fallback
  return 'http://localhost:5000/api';
}

const API_BASE_URL = computeApiBase();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      if (import.meta.env && import.meta.env.DEV) {
        console.debug('[ApiService] Request:', config.method || 'GET', url);
      }

      const response = await fetch(url, config);

      // Attempt to parse JSON, but handle empty/non-JSON responses
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        data = { raw: text };
      }

      if (!response.ok) {
        const message = (data && data.message) ? data.message : response.statusText || 'Something went wrong';
        const err = new Error(message);
        err.status = response.status;
        err.response = data;
        throw err;
      }

      return data;
    } catch (error) {
      if (error.status === 401 || (error.message && error.message.toLowerCase().includes('token'))) {
        this.setToken(null);
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  logout() {
    this.setToken(null);
  }

  // Customer methods
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async addCustomerFeedback(id, feedback) {
    return this.request(`/customers/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getCustomerStats() {
    return this.request('/customers/stats/overview');
  }

  // Menu methods
  async getMenuItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu${queryString ? `?${queryString}` : ''}`);
  }

  async getMenuItem(id) {
    return this.request(`/menu/${id}`);
  }

  async createMenuItem(menuData) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  async updateMenuItem(id, menuData) {
    return this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    });
  }

  async deleteMenuItem(id) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleMenuItemAvailability(id, isAvailable) {
    return this.request(`/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
  }

  async getPopularMenuItems(limit = 10) {
    return this.request(`/menu/stats/popular?limit=${limit}`);
  }

  async getMenuCategoryStats() {
    return this.request('/menu/stats/categories');
  }

  // Menu management helper methods
  async getActiveMenuItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu/active${queryString ? `?${queryString}` : ''}`);
  }

  async getOutOfStockMenu(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu/out-of-stock${queryString ? `?${queryString}` : ''}`);
  }

  async getSeasonalSpecials(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu/specials${queryString ? `?${queryString}` : ''}`);
  }

  async getMenuPerformance(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu/performance${queryString ? `?${queryString}` : ''}`);
  }

  // Order methods
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id, status, actualTime) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actualTime }),
    });
  }

  async updatePaymentStatus(id, paymentData) {
    return this.request(`/orders/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async addOrderFeedback(id, feedback) {
    return this.request(`/orders/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getOrderStats() {
    return this.request('/orders/stats/overview');
  }

  // Reservation methods
  async getReservations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getReservation(id) {
    return this.request(`/reservations/${id}`);
  }

  async createReservation(reservationData) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  async updateReservation(id, reservationData) {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    });
  }

  async deleteReservation(id) {
    return this.request(`/reservations/${id}`, {
      method: 'DELETE',
    });
  }

  async getTableAvailability(date) {
    return this.request(`/reservations/availability/${date}`);
  }

  async getReservationStats() {
    return this.request('/reservations/stats/overview');
  }

  // Staff methods
  async getStaff(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff${queryString ? `?${queryString}` : ''}`);
  }

  async getStaffMember(id) {
    return this.request(`/staff/${id}`);
  }

  async createStaffMember(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaffMember(id, staffData) {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async deleteStaffMember(id) {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  async getStaffPerformance(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/${id}/performance${queryString ? `?${queryString}` : ''}`);
  }

  async getStaffStats() {
    return this.request('/staff/stats/overview');
  }

  // Staff & Operations methods
  async getStaffAttendance(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/attendance${queryString ? `?${queryString}` : ''}`);
  }

  async getStaffTopPerformance(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/performance/top${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/pending-tasks${queryString ? `?${queryString}` : ''}`);
  }

  async getShiftOverview(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/shift-overview${queryString ? `?${queryString}` : ''}`);
  }

  // Staff-specific helpers
  async getAssignedOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/assigned-orders${queryString ? `?${queryString}` : ''}`);
  }

  async updateAssignedOrderStatus(id, status) {
    return this.request(`/staff/assigned-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getInventoryTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/inventory-tasks${queryString ? `?${queryString}` : ''}`);
  }

  async getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/messages${queryString ? `?${queryString}` : ''}`);
  }

  async postMessage(payload) {
    return this.request('/staff/messages', { method: 'POST', body: JSON.stringify(payload) });
  }

  async getReservationsForStaff(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getTrainingModules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/staff/training${queryString ? `?${queryString}` : ''}`);
  }

  async postAvailability(payload) {
    return this.request('/staff/availability', { method: 'POST', body: JSON.stringify(payload) });
  }

  // Report methods
  async getSalesReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/sales${queryString ? `?${queryString}` : ''}`);
  }

  async getTopPerformers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/top-performers${queryString ? `?${queryString}` : ''}`);
  }

  async getTrends(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/trends${queryString ? `?${queryString}` : ''}`);
  }

  async getBranchComparisons(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/branch-comparisons${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomerDemographics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/customer-demographics${queryString ? `?${queryString}` : ''}`);
  }

  async getMarketingImpact(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/marketing-impact${queryString ? `?${queryString}` : ''}`);
  }

  async getProfitabilityByCategory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/profitability-category${queryString ? `?${queryString}` : ''}`);
  }

  async getRecentActivity(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/recent-activity${queryString ? `?${queryString}` : ''}`);
  }

  async getSupplierAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/supplier-alerts${queryString ? `?${queryString}` : ''}`);
  }

  // Owner / Executive API helpers
  async getOwnerOverview() {
    return this.get('/reports/owner/overview');
  }

  async getOwnerBranches() {
    return this.get('/reports/owner/branches');
  }

  async getOwnerFinancials() {
    return this.get('/reports/owner/financials');
  }

  async getOwnerCustomers() {
    return this.get('/reports/owner/customers');
  }

  async getOwnerMenuInsights() {
    return this.get('/reports/owner/menu-insights');
  }

  async getOwnerMarketing() {
    return this.get('/reports/owner/marketing');
  }

  async getOwnerStaff() {
    return this.get('/reports/owner/staff');
  }

  async getOwnerRisk() {
    return this.get('/reports/owner/risk');
  }

  async getOwnerForecasts() {
    return this.get('/reports/owner/forecasts');
  }

  async getReservationConflicts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/reservation-conflicts${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomerComplaints(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/customer-complaints${queryString ? `?${queryString}` : ''}`);
  }

  async getDelayedOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/delayed-orders${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomerReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomerInsights() {
    return this.request('/reports/customers/insights');
  }

  async getMenuReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/menu${queryString ? `?${queryString}` : ''}`);
  }

  async getReservationReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getOrdersOverview() {
    return this.request('/reports/orders-overview');
  }

  async getDashboardReport() {
    return this.request('/reports/dashboard');
  }

  // Inventory methods
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryItem(itemData) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async getStockLevels() {
    return this.request('/inventory/stock-levels');
  }

  async getLowStock() {
    return this.request('/inventory/low-stock');
  }

  async getFastSlow(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/fast-slow${queryString ? `?${queryString}` : ''}`);
  }

  async getWastage(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/wastage${queryString ? `?${queryString}` : ''}`);
  }

  async getSupplierStatus() {
    return this.request('/inventory/suppliers/status');
  }
}

export default new ApiService();