import { useEffect, useState, useCallback, useRef } from 'react';

interface UserPresence {
  user_id: string;
  username: string;
  cursor_position?: { x: number; y: number };
  selected_node?: string;
  status: string;
}

interface CollaborationState {
  activeUsers: UserPresence[];
  totalUsers: number;
  lockedResources: { resource_id: string; owner: string }[];
}

export function useCollaboration(workspaceId: string, userId: string, username: string) {
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    activeUsers: [],
    totalUsers: 0,
    lockedResources: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!workspaceId || !userId) return;

    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/collaboration/${workspaceId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'join',
        workspace_id: workspaceId,
        user_id: userId,
        username: username
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'workspace_state') {
        setCollaborationState({
          activeUsers: data.active_users || [],
          totalUsers: data.total_users || 0,
          lockedResources: data.locked_resources || []
        });
      } else if (data.type === 'user_joined') {
        setCollaborationState(prev => ({
          ...prev,
          activeUsers: [...prev.activeUsers, data.user],
          totalUsers: prev.totalUsers + 1
        }));
      } else if (data.type === 'user_left') {
        setCollaborationState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.filter(u => u.user_id !== data.user_id),
          totalUsers: Math.max(0, prev.totalUsers - 1)
        }));
      } else if (data.type === 'cursor_update') {
        setCollaborationState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.map(u =>
            u.user_id === data.user_id
              ? { ...u, cursor_position: data.cursor_position }
              : u
          )
        }));
      } else if (data.type === 'selection_update') {
        setCollaborationState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.map(u =>
            u.user_id === data.user_id
              ? { ...u, selected_node: data.selected_node }
              : u
          )
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave',
          workspace_id: workspaceId,
          user_id: userId
        }));
      }
      ws.close();
    };
  }, [workspaceId, userId, username]);

  const updateCursor = useCallback((x: number, y: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_update',
        user_id: userId,
        x,
        y
      }));
    }
  }, [userId]);

  const updateSelection = useCallback((nodeId: string | null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'selection_update',
        user_id: userId,
        node_id: nodeId
      }));
    }
  }, [userId]);

  const requestLock = useCallback(async (resourceId: string): Promise<boolean> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return new Promise((resolve) => {
        const handler = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'lock_response' && data.resource_id === resourceId) {
            wsRef.current?.removeEventListener('message', handler);
            resolve(data.success);
          }
        };
        
        wsRef.current?.addEventListener('message', handler);
        
        wsRef.current?.send(JSON.stringify({
          type: 'request_lock',
          workspace_id: workspaceId,
          resource_id: resourceId,
          user_id: userId
        }));
        
        setTimeout(() => {
          wsRef.current?.removeEventListener('message', handler);
          resolve(false);
        }, 5000);
      });
    }
    return false;
  }, [workspaceId, userId]);

  const releaseLock = useCallback((resourceId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'release_lock',
        workspace_id: workspaceId,
        resource_id: resourceId,
        user_id: userId
      }));
    }
  }, [workspaceId, userId]);

  return {
    collaborationState,
    isConnected,
    updateCursor,
    updateSelection,
    requestLock,
    releaseLock
  };
}
