import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { userService } from '../services/api/user.service';
import { User, UserRole, UserStatus } from '../types/user';
import { useAuth } from '../context/AuthContext';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addFormData, setAddFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: UserRole.CUSTOMER,
    initialCredits: 0
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
    status: UserStatus.ACTIVE
  });
  const [creditsFormData, setCreditsFormData] = useState({
    amount: 0,
    operation: 'add' as 'add' | 'subtract'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUserHierarchy();
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentUser?.role === UserRole.SUPER_ADMIN && addFormData.role === UserRole.RESELLER) {
        await userService.createReseller({
          email: addFormData.email,
          password: addFormData.password,
          name: addFormData.name,
          initialCredits: addFormData.initialCredits
        });
      } else {
        await userService.createCustomer({
          email: addFormData.email,
          password: addFormData.password,
          name: addFormData.name,
          resellerId: currentUser?.id as number,
          initialCredits: addFormData.initialCredits
        });
      }
      setSuccess('User created successfully!');
      setIsAddDialogOpen(false);
      fetchUsers();
      resetAddForm();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    try {
      await userService.updateUserStatus(selectedUser.id, editFormData.status as UserStatus);
      
      // In a real implementation, we'd call an updateUser API here
      // For now, just simulate an update with status change
      
      setSuccess('User updated successfully!');
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsOperation = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    try {
      if (creditsFormData.operation === 'add') {
        await userService.addCredits(selectedUser.id, creditsFormData.amount);
      } else {
        await userService.deductCredits(selectedUser.id, creditsFormData.amount);
      }
      
      setSuccess(`Credits ${creditsFormData.operation === 'add' ? 'added to' : 'deducted from'} user successfully!`);
      setIsCreditsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error managing credits:', error);
      setError('Failed to update credits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, we'd call a deleteUser API
      // For now, just simulate by updating the status to INACTIVE
      await userService.updateUserStatus(selectedUser.id, UserStatus.INACTIVE);
      
      setSuccess('User deleted successfully!');
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setAddFormData({
      email: '',
      password: '',
      name: '',
      role: UserRole.CUSTOMER,
      initialCredits: 0
    });
  };

  const prepareEditForm = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      name: user.username,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const prepareCreditsForm = (user: User) => {
    setSelectedUser(user);
    setCreditsFormData({
      amount: 0,
      operation: 'add'
    });
    setIsCreditsDialogOpen(true);
  };

  return (
    <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        User Management
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          sx={{
            backgroundColor: '#00f3ff',
            color: '#000',
            '&:hover': {
              backgroundColor: '#00c8d4',
            },
          }}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: '#1a1a1a', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#2a2a2a' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>Name</TableCell>
              <TableCell sx={{ color: '#fff' }}>Email</TableCell>
              <TableCell sx={{ color: '#fff' }}>Role</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Credits</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress sx={{ color: '#00f3ff' }} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: '#aaa' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ color: '#fff' }}>{user.username}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{user.email}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: user.role === UserRole.SUPER_ADMIN ? '#f44336' : 
                                user.role === UserRole.RESELLER ? '#3f51b5' : '#4caf50',
                        color: '#fff'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    <Chip
                      label={user.status}
                      size="small"
                      sx={{
                        bgcolor: user.status === UserStatus.ACTIVE ? '#4caf50' : 
                                user.status === UserStatus.INACTIVE ? '#9e9e9e' : '#f44336',
                        color: '#fff'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{user.credits_balance}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton onClick={() => prepareEditForm(user)} sx={{ color: '#00f3ff' }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Manage Credits">
                      <IconButton onClick={() => prepareCreditsForm(user)} sx={{ color: '#ffc107' }}>
                        <MonetizationOnIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete User">
                      <IconButton 
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteDialogOpen(true);
                        }}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
              />
            </Grid>
            {currentUser?.role === UserRole.SUPER_ADMIN && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={addFormData.role}
                    label="Role"
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as UserRole })}
                  >
                    <MenuItem value={UserRole.RESELLER}>Reseller</MenuItem>
                    <MenuItem value={UserRole.CUSTOMER}>Customer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Initial Credits"
                type="number"
                value={addFormData.initialCredits}
                onChange={(e) => setAddFormData({ ...addFormData, initialCredits: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser}
            disabled={loading || !addFormData.email || !addFormData.password || !addFormData.name}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                >
                  <MenuItem value={UserStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={UserStatus.INACTIVE}>Inactive</MenuItem>
                  <MenuItem value={UserStatus.SUSPENDED}>Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateUser}
            disabled={loading}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credits Management Dialog */}
      <Dialog open={isCreditsDialogOpen} onClose={() => setIsCreditsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Credits</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            User: {selectedUser?.username}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Current Credits: {selectedUser?.credits_balance}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Operation</InputLabel>
                <Select
                  value={creditsFormData.operation}
                  label="Operation"
                  onChange={(e) => setCreditsFormData({ ...creditsFormData, operation: e.target.value as 'add' | 'subtract' })}
                >
                  <MenuItem value="add">Add Credits</MenuItem>
                  <MenuItem value="subtract">Deduct Credits</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={creditsFormData.amount}
                onChange={(e) => setCreditsFormData({ ...creditsFormData, amount: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreditsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreditsOperation}
            disabled={loading || creditsFormData.amount <= 0}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Update Credits'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the user: {selectedUser?.username}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action will set the user to inactive status. All associated data will be retained but inaccessible to the user.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
