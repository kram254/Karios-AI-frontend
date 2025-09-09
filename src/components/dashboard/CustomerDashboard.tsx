import React, { useEffect, useState } from 'react';
import { Grid, Typography, Box, Button, CircularProgress } from '@mui/material';
import { TrendingDown, Savings, Receipt, Key, CreditCard, Refresh } from '@mui/icons-material';
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
                            AI Agent Overview
                        </Typography>
                        <Typography sx={{ 
                            fontSize: '0.875rem', 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Manage your AI agents, monitor usage, and track system performance.
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
                            New Chat
                        </Button>
                    </Box>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <TrendingDown sx={{ fontSize: '16px' }} />
                                        Available Credits
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#f97316', fontFamily: 'Inter, sans-serif' }}>
                                        +12.4%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2rem',
                                    fontWeight: 500,
                                    mb: 3,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : credits}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '2px',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        View Details
                                    </Button>
                                    <Button sx={{
                                        minWidth: '28px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                                    }}>
                                        <Key sx={{ fontSize: '16px' }} />
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backgroundImage: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.1) 100%)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <Savings sx={{ fontSize: '16px' }} />
                                        Active Chats
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#f97316', fontFamily: 'Inter, sans-serif' }}>
                                        +18.7%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2rem',
                                    fontWeight: 500,
                                    mb: 3,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : activeChats}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '2px',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        View Details
                                    </Button>
                                    <Button sx={{
                                        minWidth: '28px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                                    }}>
                                        <Key sx={{ fontSize: '16px' }} />
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Box sx={{
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backgroundImage: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(13, 148, 136, 0.1) 100%)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <Receipt sx={{ fontSize: '16px' }} />
                                        Knowledge Items
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#f97316', fontFamily: 'Inter, sans-serif' }}>
                                        +7.1%
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '2rem',
                                    fontWeight: 500,
                                    mb: 3,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {loading ? <CircularProgress size={30} sx={{ color: 'white' }} /> : knowledgeItems}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '2px',
                                        color: 'white',
                                        p: 0,
                                        minWidth: 'auto',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        View Details
                                    </Button>
                                    <Button sx={{
                                        minWidth: '28px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                                    }}>
                                        <Key sx={{ fontSize: '16px' }} />
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
