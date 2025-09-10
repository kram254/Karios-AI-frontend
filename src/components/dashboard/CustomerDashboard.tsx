import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Grid } from '@mui/material';
import { TrendingDown, Savings, Receipt, Key, CreditCard, Refresh, SmartToy, Dashboard, Analytics, Home, Search, Notifications, Settings, Logout, Shield, TrendingUp, Storage, Memory } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api/user.service';
import { monitoringService } from '../../services/api/monitoring.service';

export const CustomerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const [activeChats, setActiveChats] = useState(0);
    const [knowledgeItems, setKnowledgeItems] = useState(0);
    const [tokenUsage, setTokenUsage] = useState(0);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [dbConnections, setDbConnections] = useState(0);
    const [apiCalls, setApiCalls] = useState(0);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const userResponse = await userService.getCurrentUser();
                const userId = userResponse.data.id;
                
                const creditsResponse = await monitoringService.getCreditsInfo(userId);
                setCredits(creditsResponse.data.balance);
                
                const usageResponse = await monitoringService.getUserUsage(userId);
                setActiveChats((usageResponse.data as any)?.activeChatsSessions || 0);
                const knowledgeResponse = await fetch('/api/v1/knowledge/count?userId=' + userId);
                const knowledgeData = await knowledgeResponse.json();
                setKnowledgeItems(knowledgeData.count || 0);
                
                // Fetch token usage
                setTokenUsage((usageResponse.data as any)?.token_usage || 0);
                
                // Fetch system health
                const healthResponse = await monitoringService.getSystemHealth();
                setSystemHealth(healthResponse.data);
                
                // Fetch database metrics
                setDbConnections(healthResponse.data?.database?.connections || 0);
                setApiCalls(healthResponse.data?.api?.total_calls || 0);
                
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
        <Box sx={{
            width: '100%',
            maxWidth: '1440px',
            minHeight: '600px',
            height: { xs: 'auto', lg: 'min(900px, calc(100vh - 2rem))' },
            background: 'linear-gradient(135deg, #0d0b16 0%, #151226 100%)',
            borderRadius: '8px',
            overflow: 'hidden',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            mx: 'auto',
            my: 2
        }}>
            <Box sx={{ display: 'flex', height: '100%', flexDirection: { xs: 'column', lg: 'row' } }}>
                <Box sx={{
                    width: { xs: '100%', lg: '256px' },
                    background: 'linear-gradient(180deg, #191428 0%, #0e0a1c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: { lg: '100%' },
                    overflowY: 'auto'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: { xs: 2, lg: 3 } }}>
                        <Box sx={{ width: '16px', height: '16px', backgroundColor: '#78716c', borderRadius: '50%' }} />
                        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                            AI AgentHub
                        </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1, px: 2, py: 1, overflowY: 'auto' }}>
                        <Button sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: '8px',
                            backgroundColor: 'rgba(120, 113, 108, 0.2)',
                            color: 'white',
                            justifyContent: 'flex-start',
                            mb: 0.5,
                            '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.3)' }
                        }}>
                            <Home sx={{ fontSize: '20px' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                Overview
                            </Typography>
                        </Button>
                        
                        <Button sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: '8px',
                            color: 'white',
                            justifyContent: 'flex-start',
                            mb: 0.5,
                            '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.2)' }
                        }}>
                            <Analytics sx={{ fontSize: '20px' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                Analytics
                            </Typography>
                        </Button>
                        
                        <Button sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: '8px',
                            color: 'white',
                            justifyContent: 'flex-start',
                            mb: 0.5,
                            '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.2)' }
                        }}>
                            <SmartToy sx={{ fontSize: '20px' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                AI Agents
                            </Typography>
                        </Button>
                        
                        <Button sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: '8px',
                            color: 'white',
                            justifyContent: 'flex-start',
                            mb: 2,
                            '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.2)' }
                        }}>
                            <Storage sx={{ fontSize: '20px' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                Database
                            </Typography>
                        </Button>
                        
                        <Box sx={{ mb: 1 }}>
                            <Button sx={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 2,
                                py: 1.5,
                                borderRadius: '8px',
                                color: 'white',
                                '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.2)' }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <TrendingUp sx={{ fontSize: '20px' }} />
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                        Smart Insights
                                    </Typography>
                                </Box>
                                <TrendingDown sx={{ fontSize: '16px' }} />
                            </Button>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: { xs: 2, lg: 3 } }}>
                        <Box sx={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6b46c1' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                Admin User
                            </Typography>
                        </Box>
                        <Button sx={{
                            minWidth: '32px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(120, 113, 108, 0.3)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.4)' }
                        }}>
                            <Logout sx={{ fontSize: '16px' }} />
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { sm: 'center' },
                        justifyContent: 'space-between',
                        px: { xs: 2, sm: 4 },
                        py: { xs: 2, lg: 3 },
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        gap: 2
                    }}>
                        <Box>
                            <Typography sx={{ 
                                fontSize: '2rem', 
                                fontWeight: 500,
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
                        </Box>
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
                                <Search sx={{ fontSize: '20px' }} />
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
                                <Notifications sx={{ fontSize: '20px' }} />
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
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, 
                            gap: { xs: 2, sm: 3 }, 
                            px: { xs: 2, sm: 4 }, 
                            py: { xs: 2, lg: 3 } 
                        }}>
                            <Box sx={{
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.05)',
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
                        </Box>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, 
                            gap: { xs: 2, sm: 3 }, 
                            px: { xs: 2, sm: 4 }, 
                            py: { xs: 2, lg: 3 } 
                        }}>
                            <Box sx={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <Shield sx={{ fontSize: '20px' }} />
                                        Account Protection
                                    </Typography>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '50px',
                                        backgroundColor: 'rgba(120, 113, 108, 0.2)',
                                        color: 'white',
                                        fontFamily: 'Inter, sans-serif',
                                        '&:hover': { backgroundColor: 'rgba(120, 113, 108, 0.3)' }
                                    }}>
                                        Review
                                    </Button>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                                        System Protection: 95%
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '50px',
                                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                        color: '#f59e0b',
                                        fontFamily: 'Inter, sans-serif',
                                        '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.3)' }
                                    }}>
                                        All Systems Normal
                                    </Button>
                                </Box>
                            </Box>

                            <Box sx={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <TrendingUp sx={{ fontSize: '20px' }} />
                                        Budget Tracking
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                                        Token Usage: {tokenUsage.toLocaleString()} / Month
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ 
                            px: { xs: 2, sm: 4 }, 
                            py: { xs: 2, lg: 3 } 
                        }}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { sm: 'center' },
                                mb: 2,
                                gap: 1
                            }}>
                                <Typography sx={{
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    System Health & Database Status
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
                            overflowX: 'auto', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(255, 255, 255, 0.1)' 
                        }}>
                            <Box component="table" sx={{ minWidth: '100%', fontSize: '0.875rem' }}>
                                <Box component="thead" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                    <Box component="tr">
                                        <Box component="th" sx={{ 
                                            px: 2, py: 1.5, 
                                            textAlign: 'left', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif',
                                            color: 'white',
                                            borderBottom: 'none'
                                        }}>
                                            System Component
                                        </Box>
                                        <Box component="th" sx={{ 
                                            px: 2, py: 1.5, 
                                            textAlign: 'left', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif',
                                            color: 'white',
                                            borderBottom: 'none'
                                        }}>
                                            Status
                                        </Box>
                                        <Box component="th" sx={{ 
                                            px: 2, py: 1.5, 
                                            textAlign: 'left', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif',
                                            color: 'white',
                                            borderBottom: 'none'
                                        }}>
                                            Health
                                        </Box>
                                        <Box component="th" sx={{ 
                                            px: 2, py: 1.5, 
                                            textAlign: 'left', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif',
                                            color: 'white',
                                            borderBottom: 'none'
                                        }}>
                                            Metrics
                                        </Box>
                                        <Box component="th" sx={{ 
                                            px: 2, py: 1.5, 
                                            textAlign: 'left', 
                                            fontWeight: 500, 
                                            fontFamily: 'Inter, sans-serif',
                                            color: 'white',
                                            borderBottom: 'none'
                                        }}>
                                            Action
                                        </Box>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    <Box component="tr" sx={{ 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Storage sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    Database Server
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
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
                                                Online
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                Healthy
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                {dbConnections} connections
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
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
                                                Monitor
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box component="tr" sx={{ 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SmartToy sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    AI Agent Service
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
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
                                                Running
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                Optimal
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                {apiCalls.toLocaleString()} API calls
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Button 
                                                onClick={() => navigate('/agents')}
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

                                    <Box component="tr" sx={{ 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    }}>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Memory sx={{ fontSize: '16px', color: '#8b5cf6' }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                    Token Management
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
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
                                                Monitoring
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                Active
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                                                {tokenUsage.toLocaleString()} tokens used
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ px: 2, py: 1.5 }}>
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
                                                View Usage
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                        </Box>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, 
                            gap: { xs: 2, sm: 3 }, 
                            px: { xs: 2, sm: 4 }, 
                            py: { xs: 2, lg: 3 } 
                        }}>
                            <Box sx={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <Analytics sx={{ fontSize: '20px' }} />
                                        Agent Performance
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                        fontSize: '2rem', 
                                        fontWeight: 700, 
                                        fontFamily: 'Inter, sans-serif',
                                        mb: 1
                                    }}>
                                        94.2%
                                    </Typography>
                                    <Typography sx={{ 
                                        color: 'rgba(255, 255, 255, 0.6)', 
                                        fontSize: '0.75rem',
                                        fontFamily: 'Inter, sans-serif' 
                                    }}>
                                        Success Rate
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                        color: '#22c55e', 
                                        fontSize: '0.75rem',
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}>
                                        <TrendingUp sx={{ fontSize: '12px' }} />
                                        +2.3% vs last month
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <SmartToy sx={{ fontSize: '20px' }} />
                                        Active Sessions
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                        fontSize: '2rem', 
                                        fontWeight: 700, 
                                        fontFamily: 'Inter, sans-serif',
                                        mb: 1
                                    }}>
                                        {activeChats}
                                    </Typography>
                                    <Typography sx={{ 
                                        color: 'rgba(255, 255, 255, 0.6)', 
                                        fontSize: '0.75rem',
                                        fontFamily: 'Inter, sans-serif' 
                                    }}>
                                        Live Conversations
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                        color: '#8b5cf6', 
                                        fontSize: '0.75rem',
                                        fontFamily: 'Inter, sans-serif' 
                                    }}>
                                        Real-time monitoring
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                p: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <Memory sx={{ fontSize: '20px' }} />
                                        Knowledge Base
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <Typography sx={{ 
                                        fontSize: '2rem', 
                                        fontWeight: 700, 
                                        fontFamily: 'Inter, sans-serif',
                                        mb: 1
                                    }}>
                                        {knowledgeItems.toLocaleString()}
                                    </Typography>
                                    <Typography sx={{ 
                                        color: 'rgba(255, 255, 255, 0.6)', 
                                        fontSize: '0.75rem',
                                        fontFamily: 'Inter, sans-serif' 
                                    }}>
                                        Total Items
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button sx={{
                                        fontSize: '0.75rem',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '50px',
                                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                        color: '#8b5cf6',
                                        fontFamily: 'Inter, sans-serif',
                                        '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' }
                                    }}>
                                        Manage
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ 
                            px: { xs: 2, sm: 4 }, 
                            py: { xs: 2, lg: 3 } 
                        }}>
                            <Typography sx={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                fontFamily: 'Inter, sans-serif',
                                mb: 2
                            }}>
                                User Account Analytics
                            </Typography>
                            
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                                gap: { xs: 2, sm: 3 }
                            }}>
                                <Box sx={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    p: 2.5,
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        fontFamily: 'Inter, sans-serif',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <CreditCard sx={{ fontSize: '20px' }} />
                                        Credit Balance & Usage
                                    </Typography>
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                Available Credits
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                                                {credits.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ 
                                            height: '6px', 
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{ 
                                                height: '100%', 
                                                width: '73%', 
                                                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                                borderRadius: '3px'
                                            }} />
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Monthly Usage: 27%
                                        </Typography>
                                        <Button sx={{
                                            fontSize: '0.75rem',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '50px',
                                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                            color: '#22c55e',
                                            fontFamily: 'Inter, sans-serif',
                                            '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' }
                                        }}>
                                            Top Up
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    p: 2.5,
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        fontFamily: 'Inter, sans-serif',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <TrendingUp sx={{ fontSize: '20px' }} />
                                        Usage Trends
                                    </Typography>
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                                            This Month
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Inter, sans-serif', mb: 1 }}>
                                            {tokenUsage.toLocaleString()}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Total Tokens Used
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ 
                                            fontSize: '0.75rem', 
                                            fontFamily: 'Inter, sans-serif', 
                                            color: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}>
                                            <TrendingUp sx={{ fontSize: '12px' }} />
                                            +15% vs last month
                                        </Typography>
                                        <Button sx={{
                                            fontSize: '0.75rem',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '50px',
                                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                            color: '#8b5cf6',
                                            fontFamily: 'Inter, sans-serif',
                                            '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' }
                                        }}>
                                            Details
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default CustomerDashboard;
