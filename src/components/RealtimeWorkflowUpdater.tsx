import { useEffect } from 'react';
import multiAgentWebSocketService from '../services/multiAgentWebSocket';

interface RealtimeWorkflowUpdaterProps {
  chatId: string;
  onWorkflowUpdate: (data: any) => void;
}

export const RealtimeWorkflowUpdater: React.FC<RealtimeWorkflowUpdaterProps> = ({
  chatId,
  onWorkflowUpdate
}) => {
  useEffect(() => {
    const callbacks = {
      onAgentStatus: (data: any) => {
        console.log('🔥 REALTIME - Agent status update:', data);
        onWorkflowUpdate({
          type: 'agent_status',
          ...data
        });
      },
      onWorkflowUpdate: (data: any) => {
        console.log('🔥 REALTIME - Workflow update:', data);
        onWorkflowUpdate({
          type: 'workflow_update', 
          ...data
        });
      },
      onClarificationRequest: (data: any) => {
        console.log('🔥 REALTIME - Clarification request:', data);
        onWorkflowUpdate({
          type: 'clarification_request',
          ...data
        });
      }
    };

    if (!multiAgentWebSocketService.isConnected(chatId)) {
      multiAgentWebSocketService.connect(chatId, callbacks);
    }

    return () => {
      console.log('🔥 REALTIME - Cleanup realtime updater');
    };
  }, [chatId, onWorkflowUpdate]);

  return null;
};
