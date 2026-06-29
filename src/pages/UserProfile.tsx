import React, { useState, useEffect } from 'react';
import { Pencil, Save } from 'lucide-react';
import { userService } from '../services/api/user.service';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserStatus } from '../types/user';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { cn } from '../utils/cn';

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
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-neon-cyan" />
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    // Validate passwords if they are being changed
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
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

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: score, label: 'Fair', color: 'bg-yellow-500' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };

  return (
    <div className="h-full overflow-auto p-6 md:p-10">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight md:text-3xl">User Profile</div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-sm text-neon-green">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* User Info Card */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardContent className="p-6 text-center">
              <div
                className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full text-4xl font-semibold text-white"
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="text-xl font-semibold text-white">{user.username}</div>
              <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{user.email}</div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge className="text-white" style={{ backgroundColor: getRoleColor(user.role), borderColor: 'transparent' }}>
                  {user.role}
                </Badge>
                <Badge className="text-white" style={{ backgroundColor: getStatusColor(user.status), borderColor: 'transparent' }}>
                  {user.status}
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="space-y-2 text-left text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--text-secondary)]">User ID:</span>
                  <span className="truncate text-white">{user.id}</span>
                </div>

                {user.parent_id !== undefined && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[color:var(--text-secondary)]">Parent ID:</span>
                    <span className="truncate text-white">{user.parent_id}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--text-secondary)]">Credits Balance:</span>
                  <span className="font-semibold text-neon-cyan">{user.credits_balance}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--text-secondary)]">Account Created:</span>
                  <span className="text-white">{formatDate(user.created_at)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--text-secondary)]">Last Updated:</span>
                  <span className="text-white">{formatDate(user.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your name and password.</CardDescription>
              </div>

              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} disabled={loading} className="shrink-0">
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant="secondary"
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
                  disabled={loading}
                  className="shrink-0"
                >
                  Cancel
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-[color:var(--text-secondary)]">Name</div>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing || loading}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-[color:var(--text-secondary)]">Email</div>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={true}
                  />
                </div>
              </div>

              {isEditing && (
                <>
                  <div className="pt-2 text-base font-semibold text-white">Change Password</div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <div className="text-sm text-[color:var(--text-secondary)]">Current Password</div>
                      <Input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        disabled={loading}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-[color:var(--text-secondary)]">New Password</div>
                      <Input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        disabled={loading || !formData.currentPassword}
                        placeholder="Enter new password"
                      />
                      {formData.newPassword && (() => {
                        const strength = getPasswordStrength(formData.newPassword);
                        return (
                          <div className="mt-1.5 space-y-1">
                            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full transition-all ${strength.color}`} style={{ width: `${(strength.level / 5) * 100}%` }} />
                            </div>
                            <p className="text-xs text-white/40">{strength.label}</p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-[color:var(--text-secondary)]">Confirm New Password</div>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        disabled={loading || !formData.currentPassword}
                        placeholder="Confirm new password"
                        className={cn(
                          formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''
                            ? 'border-red-500/40'
                            : ''
                        )}
                      />
                      {formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== '' && (
                        <div className="text-xs text-red-200">Passwords do not match</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={loading}>
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
