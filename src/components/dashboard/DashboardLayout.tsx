import React, { ReactNode } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Book, Settings, Notifications } from '@mui/icons-material';
import { UserRole } from '../../types/user';

interface DashboardLayoutProps {
    role: UserRole;
    children: ReactNode;
}

const DRAWER_WIDTH = 240;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, children }) => {
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const getMenuItems = () => {
        const items = [
            { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
            { text: 'Knowledge Base', icon: <Book />, path: '/knowledge' },
        ];

        if (role === UserRole.SUPER_ADMIN || role === UserRole.RESELLER) {
            items.push(
                { text: 'Users', icon: <People />, path: '/users' },
                { text: 'Settings', icon: <Settings />, path: '/settings' }
            );
        }

        return items;
    };

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div" color="primary">
                    AI Sales Agent
                </Typography>
            </Toolbar>
            <List>
                {getMenuItems().map((item) => (
                    <ListItem button key={item.text}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#0A0A0A', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { sm: `${DRAWER_WIDTH}px` },
                    bgcolor: '#1A1A1A'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="h6" noWrap component="div">
                            {role.charAt(0) + role.slice(1).toLowerCase()} Dashboard
                        </Typography>
                        <IconButton color="inherit">
                            <Notifications />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: DRAWER_WIDTH,
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF'
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: DRAWER_WIDTH,
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF'
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: 8,
                    color: '#FFFFFF'
                }}
            >
                {children}
            </Box>
        </Box>
    );
};
