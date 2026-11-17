// services/seller.js
import api from './api';

export const sellerService = {
  /**
   * Seller dashboard stats
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/seller/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Seller orders: { orders: Order[], stats: { total, pending, completed, cancelled } }
   */
  async getOrders() {
    try {
      const response = await api.get('/seller/orders');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getOrder(orderId) {
    try {
      const response = await api.get(`/seller/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Move an order forward. status: confirmed | processing | shipped | cancelled
   * (shipped requires trackingNumber). Returns the updated order.
   */
  async updateOrderStatus(orderId, status, trackingNumber) {
    try {
      const response = await api.patch(`/seller/orders/${orderId}/status`, { status, trackingNumber });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Payment + shipping settings: { available, currency, payment, shipping }
   */
  async getSettings() {
    try {
      const response = await api.get('/seller/settings');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updatePaymentSettings(settings) {
    try {
      const response = await api.put('/seller/settings/payment', settings);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateShippingSettings(settings) {
    try {
      const response = await api.put('/seller/settings/shipping', settings);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Seller profile + store details
   */
  async getProfile() {
    try {
      const response = await api.get('/seller/profile');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update profile / store (FormData: fullName, phone, storeName,
   * storeDescription, avatar, logo, banner)
   */
  async updateProfile(formData) {
    try {
      const response = await api.put('/seller/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get seller products
   */
  async getProducts(params = {}) {
    try {
      const response = await api.get('/seller/products', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get single product
   */
  async getProduct(productId) {
    try {
      const response = await api.get(`/seller/products/${productId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new product
   * Supports FormData (images, files, etc.)
   */
  async createProduct(productData) {
    try {
      const isFormData = productData instanceof FormData;

      const response = await api.post(
        '/seller/products',
        productData,
        isFormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {}
      );

      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update product
   */
  async updateProduct(productId, productData) {
    try {
      const isFormData = productData instanceof FormData;

      const response = await api.put(
        `/seller/products/${productId}`,
        productData,
        isFormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {}
      );

      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/seller/products/${productId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update product stock
   */
  async updateStock(productId, stock) {
    try {
      const response = await api.patch(
        `/seller/products/${productId}/stock`,
        { stock }
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Seller store/profile info
   */
  async getStoreInfo() {
    try {
      const response = await api.get('/seller/store');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update seller store/profile
   */
  async updateStoreInfo(data) {
    try {
      const response = await api.put('/seller/store', data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Seller revenue & analytics
   */
  async getRevenue(params = {}) {
    try {
      const response = await api.get('/seller/revenue', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
