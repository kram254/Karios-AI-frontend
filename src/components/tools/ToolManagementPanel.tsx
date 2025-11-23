import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip, 
  Switch, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  VpnKey as KeyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url: string;
  auth_type: string;
  is_free: boolean;
  is_open_source: boolean;
  documentation_url: string;
  homepage_url: string;
  capabilities: string[];
  enabled: boolean;
  status: string;
  mcp_enabled: boolean;
}

interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description: string;
  server_url: string;
  supported_tools: string[];
  enabled: boolean;
  status: string;
}

const ToolManagementPanel: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTools();
    loadMcpServers();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tools/list');
      if (response.data.success) {
        setTools(response.data.tools);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMcpServers = async () => {
    try {
      const response = await axios.get('/api/tools/mcp/servers');
      if (response.data.success) {
        setMcpServers(response.data.servers);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    }
  };

  const initializeTools = async () => {
    try {
      setLoading(true);
      await axios.post('/api/tools/initialize');
      await loadTools();
    } catch (error) {
      console.error('Failed to initialize tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMcpServers = async () => {
    try {
      setLoading(true);
      await axios.post('/api/tools/mcp/initialize');
      await loadMcpServers();
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = async (tool: Tool) => {
    try {
      if (tool.enabled) {
        await axios.post('/api/tools/disable', { tool_id: tool.id });
      } else {
        await axios.post('/api/tools/enable', { tool_id: tool.id });
      }
      await loadTools();
    } catch (error) {
      console.error('Failed to toggle tool:', error);
    }
  };

  const toggleMcpServer = async (server: MCPServer) => {
    try {
      if (server.enabled) {
        await axios.post(`/api/tools/mcp/disable/${server.id}`);
      } else {
        await axios.post(`/api/tools/mcp/enable/${server.id}`);
      }
      await loadMcpServers();
    } catch (error) {
      console.error('Failed to toggle MCP server:', error);
    }
  };

  const openCredentialsDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setCredentialsDialog(true);
    setCredentials({});
  };

  const saveCredentials = async () => {
    if (!selectedTool) return;

    try {
      await axios.post('/api/tools/credentials/save', {
        tool_id: selectedTool.id,
        credentials: credentials,
      });
      setCredentialsDialog(false);
      setSelectedTool(null);
      setCredentials({});
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'configured':
        return <InfoIcon sx={{ color: '#2196F3' }} />;
      default:
        return <InfoIcon sx={{ color: '#9E9E9E' }} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      communication: '#2196F3',
      productivity: '#4CAF50',
      development: '#9C27B0',
      storage: '#FF9800',
      automation: '#F44336',
      web_browser: '#00BCD4',
      data: '#795548',
      ai: '#E91E63',
      social: '#3F51B5',
      media: '#FF5722',
    };
    return colors[category] || '#9E9E9E';
  };

  const renderToolCard = (tool: Tool) => (
    <Grid item xs={12} sm={6} md={4} key={tool.id}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: getCategoryColor(tool.category),
            boxShadow: `0 4px 20px ${getCategoryColor(tool.category)}40`,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {tool.icon_url && (
              <img
                src={tool.icon_url}
                alt={tool.display_name}
                style={{ width: 40, height: 40, marginRight: 12, borderRadius: 8 }}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {tool.display_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {tool.is_free && (
                  <Chip label="Free" size="small" sx={{ backgroundColor: '#4CAF50', color: '#fff', fontSize: '0.7rem' }} />
                )}
                {tool.is_open_source && (
                  <Chip label="Open Source" size="small" sx={{ backgroundColor: '#2196F3', color: '#fff', fontSize: '0.7rem' }} />
                )}
              </Box>
            </Box>
            <Box>{getStatusIcon(tool.status)}</Box>
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, minHeight: 40 }}>
            {tool.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={tool.category}
              size="small"
              sx={{ backgroundColor: getCategoryColor(tool.category), color: '#fff' }}
            />
            <Chip label={tool.auth_type} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }} />
            {tool.mcp_enabled && (
              <Chip label="MCP" size="small" sx={{ backgroundColor: '#9C27B0', color: '#fff' }} />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title="Documentation">
              <IconButton
                size="small"
                href={tool.documentation_url}
                target="_blank"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Homepage">
              <IconButton
                size="small"
                href={tool.homepage_url}
                target="_blank"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <LaunchIcon />
              </IconButton>
            </Tooltip>
            {tool.auth_type !== 'none' && (
              <Tooltip title="Configure Credentials">
                <IconButton
                  size="small"
                  onClick={() => openCredentialsDialog(tool)}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <KeyIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {tool.capabilities.length} capabilities
            </Typography>
            <Switch
              checked={tool.enabled}
              onChange={() => toggleTool(tool)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: getCategoryColor(tool.category),
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: getCategoryColor(tool.category),
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderMcpServerCard = (server: MCPServer) => (
    <Grid item xs={12} sm={6} md={4} key={server.id}>
      <Card
        sx={{
          height: '100%',
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#9C27B0',
            boxShadow: '0 4px 20px rgba(156, 39, 176, 0.3)',
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {server.display_name}
              </Typography>
              <Chip label="MCP Server" size="small" sx={{ backgroundColor: '#9C27B0', color: '#fff', mt: 0.5 }} />
            </Box>
            <Box>{getStatusIcon(server.status)}</Box>
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
            {server.description}
          </Typography>

          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 1 }}>
            {server.server_url}
          </Typography>

          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 2 }}>
            {server.supported_tools.length} supported tools
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Switch
              checked={server.enabled}
              onChange={() => toggleMcpServer(server)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#9C27B0',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#9C27B0',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ height: '100%', p: 3, backgroundColor: '#121212', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
          🎯 Tool Management & Authentication
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadTools();
              loadMcpServers();
            }}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={currentTab === 0 ? initializeTools : initializeMcpServers}
            sx={{ backgroundColor: '#2196F3' }}
          >
            Initialize {currentTab === 0 ? 'Tools' : 'MCP Servers'}
          </Button>
        </Box>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
          '& .Mui-selected': { color: '#2196F3' },
          '& .MuiTabs-indicator': { backgroundColor: '#2196F3' },
        }}
      >
        <Tab label={`Tools (${tools.length})`} />
        <Tab label={`MCP Servers (${mcpServers.length})`} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {currentTab === 0 && tools.map(renderToolCard)}
          {currentTab === 1 && mcpServers.map(renderMcpServerCard)}
        </Grid>
      )}

      <Dialog open={credentialsDialog} onClose={() => setCredentialsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
          Configure Credentials: {selectedTool?.display_name}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1e1e1e', pt: 2 }}>
          {selectedTool?.auth_type === 'api_key' && (
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={credentials.api_key || ''}
              onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
              sx={{ mb: 2, input: { color: '#fff' } }}
            />
          )}
          {selectedTool?.auth_type === 'oauth2' && (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              OAuth2 authentication requires browser redirect. Please use the OAuth flow button.
            </Typography>
          )}
          {selectedTool?.auth_type === 'bearer' && (
            <TextField
              fullWidth
              label="Bearer Token"
              type="password"
              value={credentials.token || ''}
              onChange={(e) => setCredentials({ ...credentials, token: e.target.value })}
              sx={{ mb: 2, input: { color: '#fff' } }}
            />
          )}
          {selectedTool?.auth_type === 'basic' && (
            <>
              <TextField
                fullWidth
                label="Username"
                value={credentials.username || ''}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                sx={{ mb: 2, input: { color: '#fff' } }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={credentials.password || ''}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                sx={{ input: { color: '#fff' } }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1e1e1e', p: 2 }}>
          <Button onClick={() => setCredentialsDialog(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button onClick={saveCredentials} variant="contained" sx={{ backgroundColor: '#2196F3' }}>
            Save Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolManagementPanel;
