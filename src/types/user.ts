export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    RESELLER = 'RESELLER',
    CUSTOMER = 'CUSTOMER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    credits_balance: number;
    parent_id?: number;
    created_at: string;
    updated_at: string;
}

export interface UserHierarchy {
    id: number;
    username: string;
    role: UserRole;
    status: UserStatus;
    credits: number;
    children: UserHierarchy[];
}

export interface CreditTransaction {
    id: number;
    user_id: number;
    amount: number;
    operation: 'add' | 'subtract';
    reason: string;
    timestamp: string;
}

export interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}
