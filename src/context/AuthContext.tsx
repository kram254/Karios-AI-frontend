import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api/user.service';
import { api } from '../services/api';
import { User, UserRole, UserStatus } from '../types/user';
import axios from 'axios'; // Import axios

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
    googleLogin: (token: string) => Promise<void>;
    register: (username: string, email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkToken: () => boolean;
    refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    loading: true,
    login: async () => {},
    googleLogin: async () => {},
    register: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
    checkToken: () => false,
    refreshAccessToken: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('token');
    });
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const applyAuthToken = (token: string | null) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return;
        }

        delete axios.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['Authorization'];
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await userService.getCurrentUser();
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            localStorage.removeItem('token');
            applyAuthToken(null);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            applyAuthToken(token);
            fetchCurrentUser();
        } else {
            applyAuthToken(null);
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
        }

        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        const newToken = localStorage.getItem('token');
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }
                
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    const googleLogin = async (token: string) => {
        try {
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
            applyAuthToken(token);
            await fetchCurrentUser();
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    const login = async (username: string, password: string, rememberMe: boolean = false) => {
        try {
            console.log('Auth context: Login attempt for user:', username);
            
            const response = await userService.login(username, password, rememberMe);
            console.log('Login response received:', response.status);
            
            localStorage.setItem('token', response.data.access_token);
            if (rememberMe && response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            } else {
                localStorage.removeItem('refresh_token');
            }
            setIsAuthenticated(true);
            applyAuthToken(response.data.access_token);
            
            try {
                await fetchCurrentUser();
                console.log('User data fetched successfully after login');
            } catch (userError) {
                console.error('Failed to fetch user data after login:', userError);
                throw new Error('Login succeeded but failed to fetch user profile');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string, rememberMe: boolean = false) => {
        try {
            const response = await userService.register({
                username,
                email,
                password
            }, rememberMe);
            
            localStorage.setItem('token', response.data.access_token);
            if (rememberMe && response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            } else {
                localStorage.removeItem('refresh_token');
            }
            setIsAuthenticated(true);
            applyAuthToken(response.data.access_token);
            
            await fetchCurrentUser();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            applyAuthToken(null);
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const refreshUser = async () => {
        await fetchCurrentUser();
    };

    const refreshAccessToken = async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            return false;
        }
        
        try {
            const response = await userService.refreshToken(refreshToken);
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            applyAuthToken(response.data.access_token);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            applyAuthToken(null);
            setIsAuthenticated(false);
            setUser(null);
            return false;
        }
    };

    const checkToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            applyAuthToken(token);
            return true;
        }
        applyAuthToken(null);
        return false;
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-surface-base">
                <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            loading,
            login, 
            googleLogin,
            register,
            logout,
            refreshUser,
            checkToken,
            refreshAccessToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};
