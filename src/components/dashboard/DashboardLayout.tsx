import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import './DashboardLayout.css';

interface MenuItem {
    text: string;
    path: string;
    roles?: UserRole[];
}

interface DashboardLayoutProps {
    role: UserRole;
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getMenuItems = (): MenuItem[] => {
        const items: MenuItem[] = [
            { text: 'Main Dashboard', path: '/dashboard' },
            { text: 'Agent Configuration', path: '/agent-config' },
            { text: 'Knowledge Base', path: '/knowledge' },
        ];

        // Super admin specific menu items
        if (role === UserRole.SUPER_ADMIN) {
            items.push(
                { text: 'System Setup', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] },
                { text: 'Reseller Management', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] },
                { text: 'Customer Management', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] },
                { text: 'Operator Management', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] },
                { text: 'Credit Management', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] },
                { text: 'Module Configuration', path: '/dashboard', roles: [UserRole.SUPER_ADMIN] }
            );
        }

        // Reseller specific menu items
        if (role === UserRole.RESELLER) {
            items.push(
                { text: 'Customer Management', path: '/dashboard', roles: [UserRole.RESELLER] },
                { text: 'Operator Management', path: '/dashboard', roles: [UserRole.RESELLER] },
                { text: 'Credit Management', path: '/dashboard', roles: [UserRole.RESELLER] }
            );
        }

        // Add user management for both super admin and reseller
        if (role === UserRole.SUPER_ADMIN || role === UserRole.RESELLER) {
            items.push(
                { text: 'Users', path: '/users' },
                { text: 'Settings', path: '/settings' }
            );
        }

        return items;
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <button 
                    className="menu-button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <Menu size={24} />
                </button>
                <h1 className="nav-title">Agentando AI</h1>
                <button 
                    className="logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={24} />
                    <span>Logout</span>
                </button>
            </nav>

            <div className="dashboard-content">
                <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-content">
                        {getMenuItems().map((item) => (
                            (!item.roles || item.roles.includes(role)) && (
                                <button 
                                    key={item.text}
                                    className="sidebar-item"
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.text}
                                </button>
                            )
                        ))}
                    </div>
                </aside>

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};
