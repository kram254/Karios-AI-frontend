import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutionTimeline } from '../../services/api/analytics.service';

interface ExecutionTimelineChartProps {
  data: ExecutionTimeline[];
}

export const ExecutionTimelineChart: React.FC<ExecutionTimelineChartProps> = ({ data }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Execution Timeline
        </Typography>
        
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="executions" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Executions"
              />
              <Line 
                type="monotone" 
                dataKey="successes" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Successes"
              />
              <Line 
                type="monotone" 
                dataKey="failures" 
                stroke="#ff6b6b" 
                strokeWidth={2}
                name="Failures"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
