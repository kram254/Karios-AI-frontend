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
    // Always authenticated for testing
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    
    // Mock user data
    const [user, setUser] = useState<User | null>({ 
        id: 1, 
        username: 'tempuser', 
        email: 'temp@example.com', 
        role: 'Customer' as UserRole, 
        status: 'active',
        credits_balance: 100,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
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
        // Bypass token checking
        console.log('Token check bypassed, using mock user');
        /*
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
        */
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
        // Just clear token but don't redirect
        localStorage.removeItem('token');
        console.log('Logged out (disabled)');
        // Normally this would set isAuthenticated to false, but we're bypassing login
        // setIsAuthenticated(false);
        // setUser(null);
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
