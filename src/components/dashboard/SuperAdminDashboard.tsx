import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';

export const SuperAdminDashboard: React.FC = () => {
    return (
        <DashboardLayout role={UserRole.SUPER_ADMIN}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Super Admin Dashboard
                    </Typography>
                </Grid>
                
                {/* Quick Stats */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Total Users
                        </Typography>
                        <Typography variant="h4">
                            0
                        </Typography>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
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
                
                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            System Health
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#00F3FF' }}>
                            Healthy
                        </Typography>
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#1A1A1A',
                            color: '#FFFFFF',
                            border: '1px solid rgba(0, 243, 255, 0.2)'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No recent activity
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </DashboardLayout>
    );
};
