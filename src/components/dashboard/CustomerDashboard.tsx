import React from 'react';
import { Grid, Paper, Typography, Box, Button, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // Function to handle creating a new chat
    const handleNewChat = () => {
        navigate('/chat');
    };
    return (
        <DashboardLayout role={UserRole.CUSTOMER}>
            <div className="dashboard-scroll-container" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <div>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#00F3FF' }}>
                            CUSTOMER
                        </Typography>
                        <Typography variant="subtitle1" component="h2" sx={{ color: '#888' }}>
                            DASHBOARD
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewChat}
                        sx={{
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0, 243, 255, 0.3)',
                            padding: '8px 16px',
                            '&:hover': {
                                bgcolor: '#00D4E0',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 12px rgba(0, 243, 255, 0.4)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        New Chat
                    </Button>
                </Grid>
                
                {/* Quick Stats */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                            Available Credits
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#00F3FF', fontWeight: 'bold', fontSize: '2.5rem', mt: 1 }}>
                            0
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Active Chats
                        </Typography>
                        <Typography variant="h4">
                            0
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Knowledge Items
                        </Typography>
                        <Typography variant="h4">
                            0
                        </Typography>
                    </Paper>
                </Grid>

                {/* Customer Administrative Functions */}
                <Grid item xs={12}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            mb: 3
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ color: '#00F3FF', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 243, 255, 0.3)', pb: 1 }}>
                            Administrative Functions
                        </Typography>
                        <List>
                            {/* System Setup Management */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            System setup management
                                        </Typography>
                                    } 
                                />
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#00F3FF', 
                                        color: '#000', 
                                        '&:hover': { bgcolor: '#00D4E0' } 
                                    }}
                                >
                                    Manage
                                </Button>
                            </ListItem>
                            
                            {/* Consumption Monitoring */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Check Consumption: token/$ (minutes ot text)
                                        </Typography>
                                    } 
                                />
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#00F3FF', 
                                        color: '#000', 
                                        '&:hover': { bgcolor: '#00D4E0' } 
                                    }}
                                >
                                    View
                                </Button>
                            </ListItem>

                            {/* System Health Check */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Check system health
                                        </Typography>
                                    } 
                                />
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#00F3FF', 
                                        color: '#000', 
                                        '&:hover': { bgcolor: '#00D4E0' } 
                                    }}
                                >
                                    Check
                                </Button>
                            </ListItem>

                            {/* Module Configuration */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Module configuration for its use
                                        </Typography>
                                    } 
                                />
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#00F3FF', 
                                        color: '#000', 
                                        '&:hover': { bgcolor: '#00D4E0' } 
                                    }}
                                >
                                    Configure
                                </Button>
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* Recent Chats */}
                <Grid item xs={12} md={8}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Recent Chats
                        </Typography>
                        <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No recent chats
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Knowledge Base */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Knowledge Base
                        </Typography>
                        <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No knowledge items
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            </div>
        </DashboardLayout>
    );
};
