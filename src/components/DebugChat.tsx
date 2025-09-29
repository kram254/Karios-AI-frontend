import React, { useState, useEffect, useRef } from 'react';
import multiAgentWebSocketService, { MultiAgentWSMessage } from '../services/multiAgentWebSocket';

interface DebugChatProps {
  chatId: string;
}

export const DebugChat: React.FC<DebugChatProps> = ({ chatId }) => {
  const [workflowState, setWorkflowState] = useState<any>({});
  const [messages, setMessages] = useState<MultiAgentWSMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (chatId) {
      console.log('🔥 DEBUG - Connecting to WebSocket for chat:', chatId);
      
      const callbacks = {
        onAgentStatus: (data: MultiAgentWSMessage) => {
          console.log('🔥 DEBUG - Agent status received:', data);
          setMessages(prev => [...prev, data]);
          setWorkflowState(prev => ({
            ...prev,
            stage: `${data.agent_type} ${data.status}`,
            lastUpdate: new Date().toLocaleTimeString()
          }));
        },
        
        onWorkflowUpdate: (data: MultiAgentWSMessage) => {
          console.log('🔥 DEBUG - Workflow update received:', data);
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
      
      return () => {
        console.log('🔥 DEBUG - Cleanup');
      };
    }
  }, [chatId]);

  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h3>🔥 DEBUG MULTI-AGENT WEBSOCKET</h3>
      <div>Chat ID: {chatId}</div>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Current Stage: {workflowState.stage || 'None'}</div>
      <div>Last Update: {workflowState.lastUpdate || 'None'}</div>
      
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
