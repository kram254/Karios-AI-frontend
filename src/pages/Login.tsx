import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Container,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loginFormData, setLoginFormData] = useState({
    username: '',
    password: ''
  });
  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginFormData.username || !loginFormData.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(loginFormData.username, loginFormData.password);
      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerFormData.username || !registerFormData.email || !registerFormData.password || !registerFormData.confirmPassword) {
      setError('Please fill out all fields');
      return;
    }

    if (registerFormData.password !== registerFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerFormData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(registerFormData.username, registerFormData.email, registerFormData.password);
      setSuccess('Account created successfully! Redirecting to chat...');
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. The username or email may already be in use.');
      }
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(0, 243, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 243, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#00F3FF',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#AAAAAA',
    },
    '& .MuiInputBase-input': {
      color: '#FFFFFF',
    }
  };

  const buttonStyles = {
    py: 1.5,
    bgcolor: '#00F3FF',
    color: '#000000',
    '&:hover': {
      bgcolor: '#00D4E0',
    },
    '&.Mui-disabled': {
      bgcolor: 'rgba(0, 243, 255, 0.2)',
      color: '#555555',
    },
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        sx={{ 
          p: 4, 
          width: '100%',
          bgcolor: '#1A1A1A',
          color: '#FFFFFF',
          border: '1px solid rgba(0, 243, 255, 0.2)'
        }}
        elevation={4}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#00F3FF',
              },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#00F3FF',
                },
              },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Register" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLoginSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  type="text"
                  value={loginFormData.username}
                  onChange={handleLoginChange}
                  required
                  disabled={loading}
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={loginFormData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={loading}
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={buttonStyles}
                >
                  {loading ? <CircularProgress size={24} /> : "Sign In"}
                </Button>
              </Grid>
            </Grid>
          </form>
          
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="#AAAAAA">
              Don't have an account?{' '}
              <Link 
                component="button"
                variant="body2"
                onClick={() => setTabValue(1)}
                sx={{ color: '#00F3FF' }}
              >
                Register here
              </Link>
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box 
            component="form" 
            onSubmit={handleRegisterSubmit} 
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fill out the form to create your account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username"
              name="username"
              type="text"
              value={registerFormData.username}
              onChange={handleRegisterChange}
              required
              disabled={loading}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={registerFormData.email}
              onChange={handleRegisterChange}
              required
              disabled={loading}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={registerFormData.password}
              onChange={handleRegisterChange}
              required
              disabled={loading}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={registerFormData.confirmPassword}
              onChange={handleRegisterChange}
              required
              disabled={loading}
              sx={textFieldStyles}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={buttonStyles}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  component="button" 
                  type="button" 
                  onClick={() => setTabValue(0)}
                  sx={{ color: '#00F3FF', textDecoration: 'none' }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Login;
