import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Clock, CheckCircle, XCircle, PlayCircle, PauseCircle } from 'lucide-react';
import axios from 'axios';

interface TimelineEvent {
  automation_id: string;
  event: string;
  status?: string;
  duration?: number;
  step_index?: number;
  timestamp: string;
  metadata?: any;
}

export function AutomationTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await axios.get('/api/metrics/timeline?limit=50');
      setEvents(response.data.timeline || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      setLoading(false);
    }
  };

  const getEventIcon = (event: TimelineEvent) => {
    if (event.event === 'start') return <PlayCircle size={20} color="#3b82f6" />;
    if (event.event === 'end') {
      if (event.status === 'success') return <CheckCircle size={20} color="#10b981" />;
      return <XCircle size={20} color="#ef4444" />;
    }
    if (event.event === 'step_execution') {
      if (event.status === 'success') return <CheckCircle size={16} color="#10b981" />;
      return <XCircle size={16} color="#ef4444" />;
    }
    return <Clock size={20} color="#8b5cf6" />;
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.event === 'start') return '#3b82f6';
    if (event.event === 'end') {
      return event.status === 'success' ? '#10b981' : '#ef4444';
    }
    if (event.event === 'step_execution') {
      return event.status === 'success' ? '#10b981' : '#ef4444';
    }
    return '#8b5cf6';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Clock size={24} color="#8b5cf6" style={{ animation: 'pulse 2s infinite' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#0a0a0a', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        Automation Execution Timeline
      </Typography>

      <Box sx={{ position: 'relative', pl: 4 }}>
        <Box 
          sx={{ 
            position: 'absolute', 
            left: 12, 
            top: 0, 
            bottom: 0, 
            width: 2, 
            bgcolor: 'rgba(139, 92, 246, 0.2)' 
          }} 
        />

        {events.map((event, index) => (
          <Box key={index} sx={{ position: 'relative', mb: 3 }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                left: -32, 
                top: 4, 
                width: 32, 
                height: 32,
                bgcolor: '#1a1a1a',
                border: `2px solid ${getEventColor(event)}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getEventIcon(event)}
            </Box>

            <Card 
              sx={{ 
                bgcolor: '#1a1a1a', 
                border: `1px solid ${getEventColor(event)}20`,
                borderLeft: `3px solid ${getEventColor(event)}`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      {event.event === 'start' && 'Automation Started'}
                      {event.event === 'end' && `Automation ${event.status === 'success' ? 'Completed' : 'Failed'}`}
                      {event.event === 'step_execution' && `Step ${event.step_index !== undefined ? event.step_index + 1 : '?'} ${event.status === 'success' ? 'Completed' : 'Failed'}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {event.automation_id.substring(0, 16)}...
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatTimestamp(event.timestamp)}
                  </Typography>
                </Box>

                {event.duration !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Clock size={14} color="rgba(255,255,255,0.5)" />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Duration: {(event.duration / 60).toFixed(2)} minutes
                    </Typography>
                  </Box>
                )}

                {event.metadata?.automation_type && (
                  <Typography variant="caption" sx={{ color: '#8b5cf6', display: 'block', mt: 1 }}>
                    Type: {event.metadata.automation_type}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}

        {events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Clock size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              No automation events yet
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
