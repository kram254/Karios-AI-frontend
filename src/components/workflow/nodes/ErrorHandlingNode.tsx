import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography } from '@mui/material';

interface ErrorHandlingNodeProps {
  data: {
    label?: string;
  };
}

export const ErrorHandlingNode = memo(({ data }: ErrorHandlingNodeProps) => {
  return (
    <Box
      sx={{
        padding: 2,
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        borderRadius: 2,
        minWidth: 200,
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {data.label || 'Try/Catch'}
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={1} mt={2}>
        <Box>
          <Typography variant="caption" display="block" mb={0.5}>Try</Typography>
          <Handle
            type="source"
            position={Position.Right}
            id="try"
            style={{ top: '40%' }}
          />
        </Box>
        <Box>
          <Typography variant="caption" display="block" mb={0.5}>Catch</Typography>
          <Handle
            type="source"
            position={Position.Right}
            id="catch"
            style={{ top: '60%' }}
          />
        </Box>
        <Box>
          <Typography variant="caption" display="block" mb={0.5}>Finally</Typography>
          <Handle
            type="source"
            position={Position.Bottom}
            id="finally"
          />
        </Box>
      </Box>
    </Box>
  );
});

ErrorHandlingNode.displayName = 'ErrorHandlingNode';
