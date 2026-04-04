import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import {
  Avatar, Box, Button, Card, CardContent, CircularProgress, Container,
  Divider, Grid, IconButton, Paper, Snackbar, Alert, TextField, Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../context/ThemeContext';

export default function UserProfile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

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
      <Paper elevation={2} square sx={{ px: 3, py: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            {user?.role === 'admin' && (
              <Tooltip title="Back to Dashboard">
                <IconButton size="small" onClick={() => navigate('/admin')}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            )}
            <Typography variant="h6" fontWeight={700} color="primary">
              My Profile
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggleMode} data-testid="theme-toggle-btn">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} data-testid="profile-logout-btn">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 80, height: 80, mx: 'auto', mb: 2,
                    bgcolor: 'primary.main', fontSize: 32,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{user?.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main',
                    color: 'white', px: 1.5, py: 0.5, borderRadius: 1,
                  }}
                >
                  {user?.role?.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={2}>
                  {user?.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Forms */}
          <Grid item xs={12} md={8}>
            {/* Profile Update */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SaveIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Edit Profile</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              <Box component="form" onSubmit={handleProfileSave}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth label="First Name" name="first_name"
                      value={profileForm.first_name} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-firstname' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth label="Last Name" name="last_name"
                      value={profileForm.last_name} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-lastname' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth required label="Email" name="email" type="email"
                      value={profileForm.email} onChange={handleProfileChange}
                      inputProps={{ 'data-testid': 'profile-email' }}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit" variant="contained" sx={{ mt: 2 }}
                  disabled={profileLoading}
                  data-testid="profile-save-btn"
                >
                  {profileLoading ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
                </Button>
              </Box>
            </Paper>

            {/* Change Password */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LockIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Change Password</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
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
