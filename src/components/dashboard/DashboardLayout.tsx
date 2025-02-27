import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import './DashboardLayout.css';

interface MenuItem {
    text: string;
    path: string;
}

interface DashboardLayoutProps {
    role: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getMenuItems = (): MenuItem[] => {
        const items: MenuItem[] = [
            { text: 'Dashboard', path: '/dashboard' },
            { text: 'Knowledge Base', path: '/knowledge' },
        ];

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
                            <button 
                                key={item.text}
                                className="sidebar-item"
                                onClick={() => navigate(item.path)}
                            >
                                {item.text}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
