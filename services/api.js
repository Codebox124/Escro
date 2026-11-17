// services/api.js
import axios from 'axios';
import { authService } from './auth';

const api = axios.create({
  // The Express backend is served by Next itself (pages/api/[...path].js), so the
  // API lives on the same origin at /api in dev and production. Override with
  // NEXT_PUBLIC_API_URL only if you host the backend somewhere else.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
    }
    return Promise.reject(error);
  }
);

export default api;