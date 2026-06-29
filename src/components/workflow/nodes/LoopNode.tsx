import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, Select, MenuItem, TextField } from '@mui/material';

interface LoopNodeProps {
  data: {
    label?: string;
    loopType?: 'for-each' | 'while' | 'repeat';
    iterations?: number;
    condition?: string;
    onLoopTypeChange?: (type: string) => void;
    onIterationsChange?: (iterations: number) => void;
    onConditionChange?: (condition: string) => void;
  };
}

export const LoopNode = memo(({ data }: LoopNodeProps) => {
  return (
    <Box
      sx={{
        padding: 2,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: 2,
        minWidth: 200,
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {data.label || 'Loop'}
      </Typography>
      
      <Select
        size="small"
        value={data.loopType || 'for-each'}
        onChange={(e) => data.onLoopTypeChange?.(e.target.value)}
        sx={{
          width: '100%',
          mt: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <MenuItem value="for-each">For Each</MenuItem>
        <MenuItem value="while">While</MenuItem>
        <MenuItem value="repeat">Repeat</MenuItem>
      </Select>
      
      {data.loopType === 'repeat' && (
        <TextField
          size="small"
          type="number"
          placeholder="Iterations"
          value={data.iterations || 1}
          onChange={(e) => data.onIterationsChange?.(parseInt(e.target.value))}
          sx={{
            width: '100%',
            mt: 1,
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            }
          }}
        />
      )}
      
      {data.loopType === 'while' && (
        <TextField
          size="small"
          placeholder="Condition"
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
      )}
      
      <Handle type="source" position={Position.Bottom} id="loop" />
    </Box>
  );
});

LoopNode.displayName = 'LoopNode';
