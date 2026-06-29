import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Box
} from '@mui/material';
import { AgentPerformance } from '../../services/api/analytics.service';

interface AgentComparisonTableProps {
  data: AgentPerformance[];
}

type SortField = keyof AgentPerformance;
type SortDirection = 'asc' | 'desc';

export const AgentComparisonTable: React.FC<AgentComparisonTableProps> = ({ data }) => {
  const [orderBy, setOrderBy] = useState<SortField>('executions');
  const [order, setOrder] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Agent Performance Comparison
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Agent Name</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'executions'}
                    direction={orderBy === 'executions' ? order : 'asc'}
                    onClick={() => handleSort('executions')}
                  >
                    Executions
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'successRate'}
                    direction={orderBy === 'successRate' ? order : 'asc'}
                    onClick={() => handleSort('successRate')}
                  >
                    Success Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'avgDuration'}
                    direction={orderBy === 'avgDuration' ? order : 'asc'}
                    onClick={() => handleSort('avgDuration')}
                  >
                    Avg Duration
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'totalCost'}
                    direction={orderBy === 'totalCost' ? order : 'asc'}
                    onClick={() => handleSort('totalCost')}
                  >
                    Total Cost
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((agent) => (
                <TableRow key={agent.agentId} hover>
                  <TableCell>{agent.agentName}</TableCell>
                  <TableCell align="right">{agent.executions}</TableCell>
                  <TableCell align="right">
                    <Box
                      component="span"
                      sx={{
                        color: agent.successRate >= 80 ? 'success.main' : 
                               agent.successRate >= 50 ? 'warning.main' : 'error.main'
                      }}
                    >
                      {agent.successRate.toFixed(1)}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">{agent.avgDuration.toFixed(2)}s</TableCell>
                  <TableCell align="right">${agent.totalCost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
