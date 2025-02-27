import { ApiService } from './index';
import { User, UserRole, UserStatus } from '../../types/user';

const api = ApiService.getInstance().getApi();

interface LoginResponse {
    token: string;
    user: User;
}

export const userService = {
    // Authentication
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { email, password }),

    // User Hierarchy
    getUserHierarchy: () =>
        api.get<User[]>('/users/hierarchy'),

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
        api.get<User>('/users/me'),

    logout: () =>
        api.post('/auth/logout', {}),
};
