import React, { useEffect, useState } from 'react';
import { Grid, Typography, Box, Button, CircularProgress } from '@mui/material';
import { ShowChart, AccountBalanceWallet, LibraryBooks, Key, CreditCard, Refresh, ArrowForward, Receipt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api/user.service';
import { monitoringService } from '../../services/api/monitoring.service';

export const CustomerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const [activeChats, setActiveChats] = useState(0);
    const [knowledgeItems, setKnowledgeItems] = useState(0);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Get current user
                const userResponse = await userService.getCurrentUser();
                const userId = userResponse.data.id;
                
                // Fetch credits information
                const creditsResponse = await monitoringService.getCreditsInfo(userId);
                setCredits(creditsResponse.data.balance);
                
                // Fetch active chats
                const usageResponse = await monitoringService.getUserUsage(userId);
                setActiveChats((usageResponse.data as any)?.activeChatsSessions || 0);
                
                // Fetch knowledge items
                const knowledgeResponse = await fetch('/api/v1/knowledge/count?userId=' + userId);
                const knowledgeData = await knowledgeResponse.json();
                setKnowledgeItems(knowledgeData.count || 0);
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                // Set default values in case of error
                setCredits(0);
                setActiveChats(0);
                setKnowledgeItems(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDashboardData();
    }, []);
    
    // Function to handle creating a new chat
    const handleNewChat = () => {
        navigate('/chat');
    };
    
    // Function to handle system health check
    const handleSystemHealthCheck = async () => {
        try {
            await monitoringService.getSystemHealth();
            alert('System health check complete - All systems operational');
        } catch (error) {
            console.error('Error checking system health:', error);
            alert('Error checking system health');
        }
    };
    
    // Function to handle token consumption check
    const handleTokenConsumptionCheck = async () => {
        try {
            const userResponse = await userService.getCurrentUser();
            const userId = userResponse.data.id;
            
            const usageResponse = await monitoringService.getUserUsage(userId);
            alert(`Token consumption: ${(usageResponse.data as any)?.token_usage || 0} tokens used`);
        } catch (error) {
            console.error('Error checking token consumption:', error);
            alert('Error checking token consumption');
        }
    };
    
    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #0d0b16 0%, #151226 100%)', 
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '100vh'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 500, 
                            fontSize: '2rem',
                            fontFamily: 'Inter, sans-serif',
                            mb: 0.5
                        }}>
                            Financial Overview
                        </Typography>
                        <Typography sx={{ 
                            fontSize: '0.875rem', 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Track expenses, detect anomalies, and manage your wealth intelligently.
                        </Typography>
                    </div>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button sx={{
                            minWidth: '36px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        }}>
                            <Key sx={{ fontSize: '20px' }} />
                        </Button>
                        <Button sx={{
                            position: 'relative',
                            minWidth: '36px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444'
                            }
                        }}>
                            <Receipt sx={{ fontSize: '20px' }} />
                        </Button>
                        <Button
                            onClick={handleNewChat}
                            sx={{
                                px: 2,
                                py: 1,
                                borderRadius: '50px',
                                backgroundColor: 'white',
                                color: 'black',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                                }
                            }}
                        >
                            Export
                        </Button>
                    </Box>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)',
                                borderRadius: '12px',
                                p: 3,
                                overflow: 'hidden',
                                height: '160px'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <ShowChart sx={{ fontSize: '18px' }} />
                                        Weekly Outflow
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#f97316', fontFamily: 'Inter, sans-serif' }}>
                                        -12.4%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2.25rem',
                                    fontWeight: 600,
                                    mb: 2,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : `$${credits.toLocaleString()}`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.875rem',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover': { opacity: 0.8 }
                                    }}>
                                        View Details
                                        <ArrowForward sx={{ fontSize: '16px' }} />
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
                                borderRadius: '12px',
                                p: 3,
                                overflow: 'hidden',
                                height: '160px'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <AccountBalanceWallet sx={{ fontSize: '18px' }} />
                                        Savings Balance
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'Inter, sans-serif' }}>
                                        +18.7%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2.25rem',
                                    fontWeight: 600,
                                    mb: 2,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : `$${(activeChats * 4150).toLocaleString()}`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.875rem',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover': { opacity: 0.8 }
                                    }}>
                                        View Details
                                        <ArrowForward sx={{ fontSize: '16px' }} />
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                                borderRadius: '12px',
                                p: 3,
                                overflow: 'hidden',
                                height: '160px'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <LibraryBooks sx={{ fontSize: '18px' }} />
                                        Total Volume
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'Inter, sans-serif' }}>
                                        +71%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2.25rem',
                                    fontWeight: 600,
                                    mb: 2,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : `$${(knowledgeItems * 7800).toLocaleString()}`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.875rem',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover': { opacity: 0.8 }
                                    }}>
                                        View Details
                                        <ArrowForward sx={{ fontSize: '16px' }} />
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography sx={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                System Alerts
                            </Typography>
                            <Button sx={{
                                fontSize: '0.75rem',
                                color: 'white',
                                '&:hover': { textDecoration: 'underline' },
                                fontFamily: 'Inter, sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}>
                                Smart Filters <Receipt sx={{ fontSize: '12px' }} />
                            </Button>
                        </Box>
                        <Box sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ 
                                display: 'table', 
                                width: '100%',
                                minWidth: '100%'
                            }}>
                                <Box sx={{
                                    display: 'table-header-group',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }}>
                                    <Box sx={{ display: 'table-row' }}>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Alert Type
                                        </Typography>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Date
                                        </Typography>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            AI Response
                                        </Typography>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Action
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'table-row-group' }}>
                                    <Box sx={{ 
                                        display: 'table-row', 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Key sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    System setup management
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Available
                                        </Typography>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Typography sx={{
                                                display: 'inline-block',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: '50px',
                                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                                color: '#8b5cf6',
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                Ready
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Button 
                                                onClick={() => navigate('/config/system')}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '50px',
                                                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                                    color: '#8b5cf6',
                                                    fontFamily: 'Inter, sans-serif',
                                                    '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' }
                                                }}
                                            >
                                                Manage
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ 
                                        display: 'table-row', 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CreditCard sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    Token consumption check
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Available
                                        </Typography>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Typography sx={{
                                                display: 'inline-block',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: '50px',
                                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                                color: '#f59e0b',
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                Monitor
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Button 
                                                onClick={handleTokenConsumptionCheck}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '50px',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                                    color: '#f59e0b',
                                                    fontFamily: 'Inter, sans-serif',
                                                    '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.3)' }
                                                }}
                                            >
                                                View
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ 
                                        display: 'table-row', 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Refresh sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    System health check
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ 
                                            display: 'table-cell', 
                                            px: 2, 
                                            py: 1.5, 
                                            fontSize: '0.875rem', 
                                            fontFamily: 'Inter, sans-serif' 
                                        }}>
                                            Available
                                        </Typography>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Typography sx={{
                                                display: 'inline-block',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: '50px',
                                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                color: '#22c55e',
                                                fontSize: '0.75rem',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                Healthy
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', px: 2, py: 1.5 }}>
                                            <Button 
                                                onClick={handleSystemHealthCheck}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '50px',
                                                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                    color: '#22c55e',
                                                    fontFamily: 'Inter, sans-serif',
                                                    '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' }
                                                }}
                                            >
                                                Check
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </div>
            </div>
        </div>
    );
};
