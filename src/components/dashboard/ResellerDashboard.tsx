import React from 'react';
import { Grid, Paper, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';

export const ResellerDashboard: React.FC = () => {
    return (
        <DashboardLayout role={UserRole.RESELLER}>
            <div className="dashboard-scroll-container" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <div>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#00F3FF' }}>
                            RESELLER
                        </Typography>
                        <Typography variant="subtitle1" component="h2" sx={{ color: '#888' }}>
                            DASHBOARD
                        </Typography>
                    </div>
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
                            Customers
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
                            Total Credits
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
                            Active Agents
                        </Typography>
                        <Typography variant="h4">
                            0
                        </Typography>
                    </Paper>
                </Grid>

                {/* Reseller Administrative Functions */}
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
                        <Typography variant="h6" gutterBottom sx={{ color: '#00F3FF', fontWeight: 'bold', borderBottom: '1px solid rgba(0, 243, 255, 0.3)', pb: 1, mb: 2 }}>
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
                                            Check Consumption: token/$ (minutes ot text) per customer
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

                            {/* Customer Management */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Add/suspend/close/delete customers
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

                            {/* Operator Management */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Add/suspend/close/delete operators
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

                            {/* Credit Management */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Credit customer management
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

                            {/* Module Configuration */}
                            <ListItem sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)', p: 2, borderRadius: 1, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#000', border: '2px solid #00F3FF' }} />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography variant="body1" fontWeight="bold">
                                            Module configuration for its use by the customer
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
                
                {/* System Status */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            System Status
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Card sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        API Health
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress 
                                            variant="determinate" 
                                            value={100} 
                                            size={30} 
                                            sx={{ color: '#00F3FF' }} 
                                        />
                                        <Typography variant="body1" sx={{ ml: 2 }}>
                                            Connected
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            
                            <Card sx={{ bgcolor: 'rgba(0, 243, 255, 0.05)' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Customer Credits
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress 
                                            variant="determinate" 
                                            value={85} 
                                            size={30} 
                                            sx={{ color: '#00F3FF' }} 
                                        />
                                        <Typography variant="body1" sx={{ ml: 2 }}>
                                            85% Available
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    </Paper>
                </Grid>

                {/* Customer Statistics */}
                <Grid item xs={12} md={6}>
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
                            Credit Usage
                        </Typography>
                        <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No usage data available
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            </div>
        </DashboardLayout>
    );
};
