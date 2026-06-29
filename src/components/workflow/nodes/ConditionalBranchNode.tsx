import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, TextField } from '@mui/material';

interface ConditionalBranchNodeProps {
  data: {
    label?: string;
    condition?: string;
    onConditionChange?: (condition: string) => void;
  };
}

export const ConditionalBranchNode = memo(({ data }: ConditionalBranchNodeProps) => {
  return (
    <Box
      sx={{
        padding: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        minWidth: 200,
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {data.label || 'Conditional Branch'}
      </Typography>
      
      <TextField
        size="small"
        placeholder="Enter condition..."
        value={data.condition || ''}
        onChange={(e) => data.onConditionChange?.(e.target.value)}
        sx={{
          width: '100%',
          mt: 1,
          '& .MuiInputBase-root': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          }
        }}
      />
      
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box>
          <Typography variant="caption" display="block" mb={0.5}>True</Typography>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '25%' }}
          />
        </Box>
        <Box>
          <Typography variant="caption" display="block" mb={0.5}>False</Typography>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '75%' }}
          />
        </Box>
      </Box>
    </Box>
  );
});

ConditionalBranchNode.displayName = 'ConditionalBranchNode';
