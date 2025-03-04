import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api/user.service';
import { User, UserRole } from '../types/user';
import axios from 'axios'; // Import axios

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkToken: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
    checkToken: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    
    const [loading, setLoading] = useState(false);

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
        // Activate token checking
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
            console.error('Login error:', error);
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
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('token');
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

    const checkToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            // Update authentication state if token exists
            setIsAuthenticated(true);
            // Also set the token in the axios instance
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
        }
        return false;
    };

    if (loading) {
        // You could return a loading component here
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            login, 
            register,
            logout,
            refreshUser,
            checkToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
