// hooks/useCurrentUser.js
'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';


export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setError(null);

      // First check if user is authenticated
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Show the cached user straight away so pages don't flash a loading
      // skeleton on every navigation; fresh data replaces it in the background.
      const cached = authService.getUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      // Get fresh user data from API
      const userData = await authService.getCurrentUser();
      
      // Update both state and localStorage
      const token = authService.getToken();
      if (token) {
        authService.setUser(userData, token);
      }
      
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err.message || 'Failed to load user data');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        authService.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    return fetchCurrentUser();
  };

  return {
    user,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user,
  };
}