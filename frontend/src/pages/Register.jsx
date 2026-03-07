import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import {
  Avatar, Box, Button, Container, Grid, Link, Paper,
  TextField, Typography, Alert, CircularProgress, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

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
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleMode} data-testid="theme-toggle-btn">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <PersonAddIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={700}>
              Create Account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth required label="First Name" name="first_name"
                  value={form.first_name} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-firstname' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="Last Name" name="last_name"
                  value={form.last_name} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-lastname' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required label="Username" name="username"
                  value={form.username} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-username' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth required label="Email Address" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  inputProps={{ 'data-testid': 'reg-email' }}
                />
              </Grid>
              <Grid item xs={12}>
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
              type="submit" fullWidth variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              data-testid="reg-submit"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign In
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
