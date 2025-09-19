import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Chip, LinearProgress } from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';

interface AutonomousTask {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress_percentage: number;
}

interface AutonomousTaskManagerProps {
    chatId: string;
    userId: number;
}

const AutonomousTaskManager: React.FC<AutonomousTaskManagerProps> = ({
    chatId,
    userId
}) => {
    const [tasks, setTasks] = useState<AutonomousTask[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/autonomous-tasks/chat/${chatId}?userId=${userId}`);
            if (response.ok) {
                const tasksData = await response.json();
                setTasks(tasksData);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const executeTask = async (taskId: number) => {
        try {
            await fetch(`/api/autonomous-tasks/${taskId}/execute`, {
                method: 'POST'
            });
            fetchTasks();
        } catch (error) {
            console.error('Failed to execute task:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [chatId, userId]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00F3FF' }}>
                    Autonomous Tasks
                </Typography>
                <Button
                    startIcon={<Refresh />}
                    onClick={fetchTasks}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    sx={{ color: '#00F3FF', borderColor: '#00F3FF' }}
                >
                    Refresh
                </Button>
            </Box>
            
            {loading && (
                <LinearProgress sx={{ mb: 2, backgroundColor: 'rgba(0, 243, 255, 0.1)' }} />
            )}
            
            {tasks.length === 0 && !loading && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', py: 3 }}>
                    No tasks found for this chat
                </Typography>
            )}
            
            {tasks.map((task) => (
                <Card key={task.id} sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
                            {task.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                            {task.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip 
                                label={task.status} 
                                size="small" 
                                color={task.status === 'completed' ? 'success' : task.status === 'failed' ? 'error' : 'default'}
                            />
                            {task.status === 'running' && (
                                <Typography variant="caption" sx={{ color: '#00F3FF' }}>
                                    {task.progress_percentage}% complete
                                </Typography>
                            )}
                        </Box>
                        
                        {task.status === 'running' && (
                            <LinearProgress 
                                variant="determinate" 
                                value={task.progress_percentage} 
                                sx={{ mb: 2, backgroundColor: 'rgba(0, 243, 255, 0.1)' }}
                            />
                        )}
                        
                        {task.status === 'pending' && (
                            <Button
                                startIcon={<PlayArrow />}
                                onClick={() => executeTask(task.id)}
                                variant="outlined"
                                size="small"
                                sx={{ color: '#00F3FF', borderColor: '#00F3FF' }}
                            >
                                Execute
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default AutonomousTaskManager;
