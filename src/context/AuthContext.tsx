import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api/user.service';
import { User } from '../types/user';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        try {
            const response = await userService.getCurrentUser();
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            console.log('Auth context: Login attempt for user:', username);
            
            const response = await userService.login(username, password);
            console.log('Login response received:', response.status);
            
            // Store the token from the response
            localStorage.setItem('token', response.data.access_token);
            setIsAuthenticated(true);
            
            // Fetch user data after successful login
            try {
                await fetchCurrentUser();
                console.log('User data fetched successfully after login');
            } catch (userError) {
                console.error('Failed to fetch user data after login:', userError);
                throw new Error('Login succeeded but failed to fetch user profile');
            }
        } catch (error) {
            console.error('Login failed in auth context:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await userService.register({
                username,
                email,
                password
            });
            // Store the token from the response
            localStorage.setItem('token', response.data.access_token);
            setIsAuthenticated(true);
            
            // Fetch user data after successful registration
            await fetchCurrentUser();
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // No need for API call since we don't have a logout endpoint
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
            // Still remove token and user data on logout failure
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            await fetchCurrentUser();
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };

    if (loading) {
        // You could return a loading component here
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
