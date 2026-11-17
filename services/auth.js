import api from "./api";

export const authService = {
    /**
     * Register a new user
     */
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data.status === 'success') {
                const { token, user } = response.data.data;
                
                // Use setUser helper to store in both localStorage and cookies
                authService.setUser(user, token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Login user
     */
    login: async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);

            /**
             * Expected backend response:
             * {
             *   status: "success",
             *   data: {
             *     token: string,
             *     user: { id, email, role, ... }
             *   }
             * }
             */
            const { token, user } = response.data.data;

            // Use setUser helper to store in both localStorage and cookies
            authService.setUser(user, token);

            return { token, user };
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Logout user - clear all auth data
     */
    logout: () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Clear cookies (required for middleware)
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Redirect to login
        window.location.href = "/login";
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        if (typeof window === 'undefined') return false;
        
        // Check localStorage first (faster)
        const token = localStorage.getItem('token');
        if (token) return true;
        
        // Fallback to checking cookies
        return document.cookie.includes('auth-token=');
    },

    /**
     * Get stored user from localStorage
     */
    getUser: () => {
        if (typeof window === 'undefined') return null;
        
        const user = localStorage.getItem("user");
        if (!user) return null;
        
        try {
            return JSON.parse(user);
        } catch (error) {
            console.error('Failed to parse user data:', error);
            return null;
        }
    },

    /**
     * Change password
     */
    updatePassword: async (currentPassword, newPassword) => {
        try {
            const response = await api.put('/auth/password', { currentPassword, newPassword });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Get current user from API
     */
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data.data.user;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Get auth token
     */
    getToken: () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    },

    /**
     * Set user and auth token
     * IMPORTANT: This stores in BOTH localStorage AND cookies
     * Cookies are required for Next.js middleware to work
     */
    setUser: (user, token) => {
        // Store in localStorage for client-side access
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Store in cookies for middleware access
        // Set expiry to 7 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        
        // Note: Using 'auth-token' in cookies (not 'token') to match middleware
        document.cookie = `auth-token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
        document.cookie = `user-role=${user.role}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
    },

    /**
     * Check if user has a specific role
     */
    hasRole: (role) => {
        const user = authService.getUser();
        return user?.role === role;
    },

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole: (roles) => {
        const user = authService.getUser();
        return user ? roles.includes(user.role) : false;
    },
};