import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Avatar, Box, Button, Grid, Link, Paper,
  TextField, Typography, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setError(apiErrors.map((e) => e.msg).join('. '));
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left branding panel */}
      <Grid
        size={{ xs: false, md: 5 }}
        sx={{
          background: 'linear-gradient(160deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            top: -80,
            right: -80,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: -60,
            left: -60,
          },
        }}
      >
        <ManageAccountsIcon sx={{ fontSize: 72, color: 'rgba(255,255,255,0.95)', mb: 3 }} />
        <Typography variant="h4" color="white" fontWeight={800} textAlign="center" gutterBottom>
          Join Us Today
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center', maxWidth: 320 }}>
          Create your account and start managing users with full role-based access control.
        </Typography>
      </Grid>

      {/* Right form panel */}
      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            maxWidth: 480,
            borderRadius: 3,
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar
              sx={{
                m: 1, mb: 2,
                width: 52, height: 52,
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              }}
            >
              <PersonAddIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={800} color="text.primary">
              Create an account
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Fill in your details to get started
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth required label="First Name" name="first_name"
                  value={form.first_name} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-firstname' }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth label="Last Name" name="last_name"
                  value={form.last_name} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-lastname' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth required label="Username" name="username"
                  value={form.username} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-username' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth required label="Email Address" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-email' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth required label="Password" name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-password' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPass((v) => !v)} edge="end">
                          {showPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit" fullWidth variant="contained" size="large"
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
              disabled={loading}
              data-testid="reg-submit"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" fontWeight={600}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
