// services/marketplace.js
import api from './api';

export const marketplaceService = {
  /**
   * Get featured products
   */
  getFeaturedProducts: async (params = {}) => {
    try {
      const response = await api.get('/products/featured', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get featured services
   */
  getFeaturedServices: async (params = {}) => {
    try {
      const response = await api.get('/services/featured', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get categories
   */
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all products with filters
   */
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get single product details
   */
  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Search products
   */
  searchProducts: async (query, params = {}) => {
    try {
      const response = await api.get('/products/search', {
        params: { q: query, ...params }
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get personalized recommendations for user
   */
  getRecommendations: async (userId) => {
    try {
      const response = await api.get(`/recommendations/${userId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};