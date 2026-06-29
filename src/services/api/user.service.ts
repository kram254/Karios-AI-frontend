import { api } from './index';
import { User, UserStatus } from '../../types/user';

interface LoginResponse {
    access_token: string;
    token_type: string;
    refresh_token?: string;
}

interface RegisterResponse {
    access_token: string;
    token_type: string;
    refresh_token?: string;
}

export const userService = {
    // Authentication
    login: (username: string, password: string, rememberMe: boolean = false) => {
        console.log('Login attempt for:', username, 'rememberMe:', rememberMe);
        
        const formData = new URLSearchParams();
        formData.append('username', username.trim());
        formData.append('password', password);
        
        return api.post<LoginResponse>(`/api/v1/users/login?remember_me=${rememberMe}`, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).catch(error => {
            console.error('Login error details:', error);
            if (error.response) {
                console.log('Error response:', error.response.data);
                console.log('Error status:', error.response.status);
            } else if (error.request) {
                console.log('No response received:', error.request);
            } else {
                console.log('Error message:', error.message);
            }
            throw error;
        });
    },
        
    register: (data: {
        email: string;
        password: string;
        username: string;
    }, rememberMe: boolean = false) =>
        api.post<RegisterResponse>(`/api/v1/users/register?remember_me=${rememberMe}`, data),

    // User Hierarchy
    getUserHierarchy: () =>
        api.get<User[]>('/api/v1/users/hierarchy'),
    
    // User Management
    createReseller: (data: {
        email: string;
        password: string;
        name: string;
        initialCredits: number;
    }) =>
        api.post<User>('/api/v1/users/reseller', data),
    
    createCustomer: (data: {
        email: string;
        password: string;
        name: string;
        resellerId: number;
        initialCredits: number;
    }) =>
        api.post<User>('/api/v1/users/customer', data),
    
    updateUserStatus: (userId: number, status: UserStatus) =>
        api.put(`/api/v1/users/${userId}/status`, { status }),
    
    // Credits Management
    addCredits: (userId: number, amount: number) =>
        api.post(`/api/v1/users/${userId}/credits/add`, { amount }),
    
    deductCredits: (userId: number, amount: number) =>
        api.post(`/api/v1/users/${userId}/credits/deduct`, { amount }),
    
    getCreditsHistory: (userId: number) =>
        api.get(`/api/v1/users/${userId}/credits/history`),
    
    // Permissions
    getUserPermissions: (userId: number) =>
        api.get(`/api/v1/users/${userId}/permissions`),
    
    updateUserPermissions: (userId: number, permissions: string[]) =>
        api.put(`/api/v1/users/${userId}/permissions`, { permissions }),
    
    // Profile Management
    updateProfile: (userId: number, data: {
        name?: string;
        email?: string;
        password?: string;
        settings?: Record<string, any>;
    }) =>
        api.put(`/api/v1/users/${userId}/profile`, data),
    
    // Session Management
    getCurrentUser: () =>
        api.get<User>('/api/v1/users/me'),
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        return api.post('/api/v1/users/logout');
    },

    refreshToken: (refreshToken: string) =>
        api.post<LoginResponse>('/api/v1/users/refresh', null, {
            params: { refresh_token: refreshToken }
        })
};
