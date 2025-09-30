import React, { useState, useEffect, useRef } from 'react';
import multiAgentWebSocketService, { MultiAgentWSMessage } from '../services/multiAgentWebSocket';

interface DebugChatProps {
  chatId: string;
}

export const DebugChat: React.FC<DebugChatProps> = ({ chatId }) => {
  const [workflowState, setWorkflowState] = useState<{ stage?: string; lastUpdate?: string }>({});
  const [messages, setMessages] = useState<MultiAgentWSMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (chatId) {
      console.log('🔥 DEBUG - Connecting to WebSocket for chat:', chatId);
      
      const callbacks = {
        onAgentStatus: (data: MultiAgentWSMessage) => {
          console.log('🔥 DEBUG - Agent status received:', data);
          setMessages(prev => [...prev, data]);
          setWorkflowState((prev: { stage?: string; lastUpdate?: string }) => ({
            ...prev,
            stage: `${data.agent_type} ${data.status}`,
            lastUpdate: new Date().toLocaleTimeString()
          }));
        },
        
        onWorkflowUpdate: (data: MultiAgentWSMessage) => {
          console.log('🔥 DEBUG - Workflow update received:', data);
          setMessages(prev => [...prev, data]);
        },
        
        onClarificationRequest: (data: MultiAgentWSMessage) => {
          console.log('🔥 DEBUG - Clarification request received:', data);
          setMessages(prev => [...prev, data]);
        },
        
        onConnectionEstablished: () => {
          console.log('🔥 DEBUG - Connection established');
          setIsConnected(true);
        },
        
        onError: (error: Event) => {
          console.error('🔥 DEBUG - WebSocket error:', error);
        },
        
        onClose: () => {
          console.log('🔥 DEBUG - Connection closed');
          setIsConnected(false);
        }
      };

      multiAgentWebSocketService.connect(chatId, callbacks);
      setIsConnected(true);
      
      return () => {
        console.log('🔥 DEBUG - Cleanup');
      };
    }
  }, [chatId]);

  return (
    <div style={{ 
      padding: '20px', 
      border: '3px solid red', 
      margin: '20px',
      backgroundColor: '#ffcccc',
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      width: '400px',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: 'red' }}>🔥 DEBUG WEBSOCKET</h3>
      <div><strong>Chat ID:</strong> {chatId}</div>
      <div><strong>Connected:</strong> {isConnected ? '✅' : '❌'}</div>
      <div><strong>Current Stage:</strong> {workflowState.stage || 'None'}</div>
      <div><strong>Last Update:</strong> {workflowState.lastUpdate || 'None'}</div>
      
      <div style={{ marginTop: '20px' }}>
        <strong>Messages Received ({messages.length}):</strong>
        <div style={{ maxHeight: '200px', overflow: 'auto', backgroundColor: '#f0f0f0', padding: '10px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>
              <strong>{msg.type}</strong> - {msg.agent_type} - {msg.status} - {msg.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
