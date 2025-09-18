import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Chip } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

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

    const executeTask = async (taskId: number) => {
        try {
            await fetch(`/api/autonomous-tasks/${taskId}/execute`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Failed to execute task:', error);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#00F3FF' }}>
                Autonomous Tasks
            </Typography>
            
            {tasks.map((task) => (
                <Card key={task.id} sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                            {task.title}
                        </Typography>
                        <Chip label={task.status} size="small" />
                        
                        {task.status === 'pending' && (
                            <Button
                                startIcon={<PlayArrow />}
                                onClick={() => executeTask(task.id)}
                                variant="outlined"
                                size="small"
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
