import { ApiService } from './index';
import { User, UserRole, UserStatus } from '../../types/user';

const api = ApiService.getInstance().getApi();

interface LoginResponse {
    access_token: string;
    token_type: string;
}

interface RegisterResponse {
    access_token: string;
    token_type: string;
}

export const userService = {
    // Authentication
    login: (username: string, password: string) => {
        console.log('Login attempt for:', username);
        
        // Format the data as x-www-form-urlencoded for OAuth2 compatibility
        const formData = new URLSearchParams();
        formData.append('username', username.trim());
        formData.append('password', password);
        
        return api.post<LoginResponse>('/api/v1/users/login', formData.toString(), {
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
    }) =>
        api.post<RegisterResponse>('/api/v1/users/register', data),

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
        api.post<User>('/users/reseller', data),

    createCustomer: (data: {
        email: string;
        password: string;
        name: string;
        resellerId: number;
        initialCredits: number;
    }) =>
        api.post<User>('/users/customer', data),

    updateUserStatus: (userId: number, status: UserStatus) =>
        api.put(`/users/${userId}/status`, { status }),

    // Credits Management
    addCredits: (userId: number, amount: number) =>
        api.post(`/users/${userId}/credits/add`, { amount }),

    deductCredits: (userId: number, amount: number) =>
        api.post(`/users/${userId}/credits/deduct`, { amount }),

    getCreditsHistory: (userId: number) =>
        api.get(`/users/${userId}/credits/history`),

    // Permissions
    getUserPermissions: (userId: number) =>
        api.get(`/users/${userId}/permissions`),

    updateUserPermissions: (userId: number, permissions: string[]) =>
        api.put(`/users/${userId}/permissions`, { permissions }),

    // Profile Management
    updateProfile: (userId: number, data: {
        name?: string;
        email?: string;
        password?: string;
        settings?: Record<string, any>;
    }) =>
        api.put(`/users/${userId}/profile`, data),

    // Session Management
    getCurrentUser: () =>
        api.get<User>('/api/v1/users/me'),

    logout: () =>
        api.post('/auth/logout', {}),
};
