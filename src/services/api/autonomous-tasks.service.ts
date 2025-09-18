import axios from 'axios';

export interface AutonomousTask {
    id: number;
    chat_id: string;
    user_id: number;
    agent_id?: number;
    title: string;
    description: string;
    task_type: 'web_automation' | 'code_generation' | 'research' | 'content_creation' | 'general';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    priority: 'low' | 'medium' | 'high' | 'critical';
    progress_percentage: number;
    estimated_duration?: number;
    actual_duration?: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    updated_at: string;
    error_message?: string;
    output_data?: any;
    execution_log?: any[];
}

export interface CreateTaskRequest {
    chat_id: string;
    user_id: number;
    description: string;
    agent_id?: number;
}

export interface TaskResponse {
    success: boolean;
    task?: AutonomousTask;
    error?: string;
    message?: string;
}

class AutonomousTasksService {
    private baseURL = '/api/autonomous-tasks';

    async createTask(request: CreateTaskRequest): Promise<TaskResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/create`, request);
            return {
                success: true,
                task: response.data.task,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to create task'
            };
        }
    }

    async executeTask(taskId: number): Promise<TaskResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/${taskId}/execute`);
            return {
                success: true,
                task: response.data.task,
                message: 'Task execution started'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to execute task'
            };
        }
    }

    async getTask(taskId: number): Promise<AutonomousTask | null> {
        try {
            const response = await axios.get(`${this.baseURL}/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch task:', error);
            return null;
        }
    }

    async getChatTasks(chatId: string): Promise<AutonomousTask[]> {
        try {
            const response = await axios.get(`${this.baseURL}/chat/${chatId}`);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch chat tasks:', error);
            return [];
        }
    }

    async cancelTask(taskId: number): Promise<TaskResponse> {
        try {
            const response = await axios.post(`${this.baseURL}/${taskId}/cancel`);
            return {
                success: true,
                message: 'Task cancelled successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to cancel task'
            };
        }
    }
}

export const autonomousTasksService = new AutonomousTasksService();
