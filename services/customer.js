// services/customer.js
import api from './api';

export const customerService = {
  /**
   * Get customer dashboard stats
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/customer/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get customer's orders
   */
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/customer/orders', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get customer's cart
   */
  getCart: async () => {
    try {
      const response = await api.get('/customer/cart');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get customer's wishlist
   */
  getWishlist: async () => {
    try {
      const response = await api.get('/customer/wishlist');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get customer's addresses
   */
  getAddresses: async () => {
    try {
      const response = await api.get('/customer/addresses');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// services/admin.js
export const adminService = {
  /**
   * Get admin dashboard stats
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all users
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all orders
   */
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/orders', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all products
   */
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/admin/products', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get platform revenue
   */
  getRevenue: async (params = {}) => {
    try {
      const response = await api.get('/admin/revenue', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// services/agency.js
export const agencyService = {
  /**
   * Get agency dashboard stats
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/agency/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get agency's campaigns
   */
  getCampaigns: async (params = {}) => {
    try {
      const response = await api.get('/agency/campaigns', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get agency's clients
   */
  getClients: async (params = {}) => {
    try {
      const response = await api.get('/agency/clients', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// services/courier.js
export const courierService = {
  /**
   * Get courier dashboard stats
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/courier/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get assigned deliveries
   */
  getDeliveries: async (params = {}) => {
    try {
      const response = await api.get('/courier/deliveries', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update delivery status
   */
  updateDeliveryStatus: async (deliveryId, status) => {
    try {
      const response = await api.put(`/courier/deliveries/${deliveryId}/status`, { status });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};