import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Link,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/components/ui/login-form';

export const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const googleToken = searchParams.get('google_token');
    const activeToken = googleToken || (provider === 'google' ? token : null);
    if (activeToken) {
      googleLogin(activeToken).then(() => {
        navigate('/chat', { replace: true });
      }).catch(() => {
        setError('Google login failed. Please try again.');
      });
    }
  }, [searchParams]);
  const [loginFormData, setLoginFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [registerRememberMe, setRegisterRememberMe] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register } = useAuth();

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
      await login(loginFormData.username, loginFormData.password, rememberMe);
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
      await register(registerFormData.username, registerFormData.email, registerFormData.password, registerRememberMe);
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
        borderColor: 'rgba(249, 115, 22, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(245, 158, 11, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#F97316',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#AAAAAA',
    },
    '& .MuiInputBase-input': {
      color: '#FFFFFF',
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/api/v1/auth/google`;
  };

  const buttonStyles = {
    py: 1.5,
    bgcolor: '#F97316',
    color: '#000000',
    '&:hover': {
      bgcolor: '#EA580C',
    },
    '&.Mui-disabled': {
      bgcolor: 'rgba(249, 115, 22, 0.2)',
      color: '#555555',
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: '#04070F' }}>
      <div className="pointer-events-none absolute inset-0" style={{ overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle at bottom left, rgba(255,69,0,0.12) 0%, transparent 70%)',
          filter: 'blur(120px)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle at top right, rgba(0,50,255,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%'
        }} />
        <style>{`
          @keyframes starPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.3); }
          }
        `}</style>
        <div style={{ position: 'absolute', top: '8%', left: '15%', width: '2px', height: '2px', borderRadius: '50%', background: '#001BFF', boxShadow: '0 0 4px 1px #001BFF', animation: 'starPulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '14%', left: '55%', width: '2px', height: '2px', borderRadius: '50%', background: '#FF8C00', boxShadow: '0 0 4px 1px #FF8C00', animation: 'starPulse 4s ease-in-out infinite 0.7s' }} />
        <div style={{ position: 'absolute', top: '22%', left: '30%', width: '2px', height: '2px', borderRadius: '50%', background: '#001BFF', boxShadow: '0 0 4px 1px #001BFF', animation: 'starPulse 4s ease-in-out infinite 1.4s' }} />
        <div style={{ position: 'absolute', top: '10%', left: '72%', width: '2px', height: '2px', borderRadius: '50%', background: '#FF8C00', boxShadow: '0 0 4px 1px #FF8C00', animation: 'starPulse 4s ease-in-out infinite 2.1s' }} />
        <div style={{ position: 'absolute', top: '18%', left: '88%', width: '2px', height: '2px', borderRadius: '50%', background: '#001BFF', boxShadow: '0 0 4px 1px #001BFF', animation: 'starPulse 4s ease-in-out infinite 2.8s' }} />
        <div style={{ position: 'absolute', top: '26%', left: '45%', width: '2px', height: '2px', borderRadius: '50%', background: '#FF8C00', boxShadow: '0 0 4px 1px #FF8C00', animation: 'starPulse 4s ease-in-out infinite 3.5s' }} />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        {tabValue === 0 ? (
          <LoginForm
            email={loginFormData.username}
            password={loginFormData.password}
            rememberMe={rememberMe}
            loading={loading}
            error={error}
            onEmailChange={(value) => setLoginFormData((prev) => ({ ...prev, username: value }))}
            onPasswordChange={(value) => setLoginFormData((prev) => ({ ...prev, password: value }))}
            onRememberMeChange={setRememberMe}
            onSubmit={handleLoginSubmit}
            onGoogleSignIn={handleGoogleLogin}
            onSignUp={() => {
              setError(null);
              setSuccess(null);
              setTabValue(1);
            }}
          />
        ) : (
          <Paper
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 420,
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(24px)'
            }}
            elevation={4}
          >
            <Box component="form" onSubmit={handleRegisterSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

              <FormControlLabel
                control={
                  <Checkbox
                    checked={registerRememberMe}
                    onChange={(e) => setRegisterRememberMe(e.target.checked)}
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&.Mui-checked': {
                        color: '#F97316',
                      },
                    }}
                  />
                }
                label="Remember me"
                sx={{ color: '#AAAAAA', mt: -1 }}
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
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setTabValue(0);
                    }}
                    sx={{ color: '#FDBA74', textDecoration: 'none' }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>

              <Box mt={2}>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Typography variant="body2" color="#AAAAAA">OR</Typography>
                </Divider>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    },
                    '&.Mui-focusVisible': {
                      outline: '2px solid #F97316',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </Box>
                  Continue with Google
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </div>
    </div>
  );
};

export default Login;
