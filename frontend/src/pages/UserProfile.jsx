import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import {
  Avatar, Box, Button, Card, CardContent, CircularProgress, Container,
  Divider, Grid, IconButton, Paper, Snackbar, Alert, TextField, Tooltip,
  Typography, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BadgeIcon from '@mui/icons-material/Badge';

export default function UserProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [pwError, setPwError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity });

  const handleProfileChange = (e) =>
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePwChange = (e) =>
    setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);
    try {
      await usersApi.update(user.id, profileForm);
      await refreshUser();
      showSnack('Profile updated successfully');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setProfileError(
        apiErrors ? apiErrors.map((e) => e.msg).join('. ') :
        err.response?.data?.message || 'Update failed'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('The new password and confirmation password do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await usersApi.changePassword(user.id, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSnack('Password changed successfully');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Bar */}
      <Paper
        elevation={0}
        square
        sx={{
          px: 3, py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            {user?.role === 'admin' && (
              <Tooltip title="Back to Dashboard">
                <IconButton size="small" onClick={() => navigate('/admin')} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <ManageAccountsIcon sx={{ color: 'white', fontSize: 26 }} />
            <Typography variant="h6" fontWeight={700} color="white">
              My Profile
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} data-testid="profile-logout-btn" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              {/* Gradient header */}
              <Box
                sx={{
                  height: 80,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                }}
              />
              <CardContent sx={{ textAlign: 'center', pt: 0 }}>
                <Avatar
                  sx={{
                    width: 80, height: 80, mx: 'auto',
                    mt: -5, mb: 1.5,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                    fontSize: 32, fontWeight: 700,
                    border: '4px solid white',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{user?.username}
                </Typography>
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: '14px !important' }} />}
                  label={user?.role?.toUpperCase()}
                  size="small"
                  sx={{
                    mt: 0.5, mb: 2,
                    background: user?.role === 'admin'
                      ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                      : 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.8)' },
                  }}
                />
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  {user?.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Forms */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Profile Update */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: 2,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <SaveIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Edit Profile</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              <Box component="form" onSubmit={handleProfileSave}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="First Name" name="first_name"
                      value={profileForm.first_name} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-firstname' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Last Name" name="last_name"
                      value={profileForm.last_name} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-lastname' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth required label="Email" name="email" type="email"
                      value={profileForm.email} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-email' }}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit" variant="contained" sx={{ mt: 2.5 }}
                  disabled={profileLoading}
                  data-testid="profile-save-btn"
                >
                  {profileLoading ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
                </Button>
              </Box>
            </Paper>

            {/* Change Password */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: 2,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <LockIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Change Password</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
              <Box component="form" onSubmit={handlePasswordSave}>
                <TextField
                  fullWidth required label="Current Password" name="currentPassword"
                  type="password" value={pwForm.currentPassword}
                  onChange={handlePwChange} sx={{ mb: 2 }}
                  inputProps={{ 'data-testid': 'pw-current' }}
                />
                <TextField
                  fullWidth required label="New Password" name="newPassword"
                  type="password" value={pwForm.newPassword}
                  onChange={handlePwChange} sx={{ mb: 2 }}
                  inputProps={{ 'data-testid': 'pw-new' }}
                />
                <TextField
                  fullWidth required label="Confirm New Password" name="confirmPassword"
                  type="password" value={pwForm.confirmPassword}
                  onChange={handlePwChange} sx={{ mb: 2 }}
                  inputProps={{ 'data-testid': 'pw-confirm' }}
                />
                <Button
                  type="submit" variant="outlined" color="warning"
                  disabled={pwLoading}
                  data-testid="pw-save-btn"
                >
                  {pwLoading ? <CircularProgress size={22} color="inherit" /> : 'Change Password'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
