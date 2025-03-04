import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import { userService } from '../services/api/user.service';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserStatus } from '../types/user';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.username,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleUpdateProfile = async () => {
    // Validate passwords if they are being changed
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        name: formData.name,
      };
      
      // Only include passwords if they are being changed
      if (formData.newPassword && formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await userService.updateProfile(user.id, updateData);
      
      setSuccess('Profile updated successfully!');
      refreshUser();
      setIsEditing(false);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '#f44336';
      case UserRole.RESELLER:
        return '#3f51b5';
      case UserRole.CUSTOMER:
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return '#4caf50';
      case UserStatus.INACTIVE:
        return '#9e9e9e';
      case UserStatus.SUSPENDED:
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

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

      <Grid container spacing={4}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(0, 243, 255, 0.2)', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  bgcolor: getRoleColor(user.role),
                  fontSize: '3rem',
                  mb: 2
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>

              <Typography variant="h5" sx={{ mb: 1, color: '#fff' }}>
                {user.username}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2, color: '#aaa' }}>
                {user.email}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                <Chip 
                  label={user.role} 
                  sx={{ bgcolor: getRoleColor(user.role), color: '#fff' }} 
                />
                <Chip 
                  label={user.status} 
                  sx={{ bgcolor: getStatusColor(user.status), color: '#fff' }} 
                />
              </Box>

              <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
              
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span style={{ color: '#aaa' }}>Credits Balance:</span>
                  <span style={{ color: '#00f3ff', fontWeight: 'bold' }}>{user.credits_balance}</span>
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span style={{ color: '#aaa' }}>Account Created:</span>
                  <span style={{ color: '#fff' }}>{formatDate(user.created_at)}</span>
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#aaa' }}>Last Updated:</span>
                  <span style={{ color: '#fff' }}>{formatDate(user.updated_at)}</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, bgcolor: '#1a1a1a', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Profile Information</Typography>
              
              {!isEditing ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{
                    bgcolor: '#00f3ff',
                    color: '#000',
                    '&:hover': {
                      bgcolor: '#00c8d4',
                    },
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to current user data
                    if (user) {
                      setFormData({
                        name: user.username,
                        email: user.email,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }
                    setError(null);
                  }}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  Cancel
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing || loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { color: '#fff' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={true} // Email cannot be changed
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { color: '#fff' }
                  }}
                />
              </Grid>
            </Grid>

            {isEditing && (
              <>
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Change Password
                </Typography>
                
                <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      disabled={loading}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      disabled={loading || !formData.currentPassword}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading || !formData.currentPassword}
                      sx={{ mb: 2 }}
                      error={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''}
                      helperText={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {isEditing && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  sx={{
                    bgcolor: '#00f3ff',
                    color: '#000',
                    '&:hover': {
                      bgcolor: '#00c8d4',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
