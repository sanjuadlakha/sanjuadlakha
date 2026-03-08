import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';

const theme = createTheme({
  palette: {
    primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3', contrastText: '#ffffff' },
    secondary: { main: '#0ea5e9', light: '#38bdf8', dark: '#0369a1', contrastText: '#ffffff' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    background: { default: '#f0f2f5', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.08)',
    '0px 2px 6px rgba(0,0,0,0.10)',
    '0px 4px 12px rgba(0,0,0,0.10)',
    '0px 6px 16px rgba(0,0,0,0.10)',
    '0px 8px 20px rgba(0,0,0,0.10)',
    '0px 10px 24px rgba(0,0,0,0.10)',
    '0px 12px 28px rgba(0,0,0,0.10)',
    '0px 14px 32px rgba(0,0,0,0.10)',
    '0px 16px 36px rgba(0,0,0,0.10)',
    '0px 18px 40px rgba(0,0,0,0.10)',
    '0px 20px 44px rgba(0,0,0,0.10)',
    '0px 22px 48px rgba(0,0,0,0.10)',
    '0px 24px 52px rgba(0,0,0,0.10)',
    '0px 26px 56px rgba(0,0,0,0.10)',
    '0px 28px 60px rgba(0,0,0,0.10)',
    '0px 30px 64px rgba(0,0,0,0.10)',
    '0px 32px 68px rgba(0,0,0,0.10)',
    '0px 34px 72px rgba(0,0,0,0.10)',
    '0px 36px 76px rgba(0,0,0,0.10)',
    '0px 38px 80px rgba(0,0,0,0.10)',
    '0px 40px 84px rgba(0,0,0,0.10)',
    '0px 42px 88px rgba(0,0,0,0.10)',
    '0px 44px 92px rgba(0,0,0,0.10)',
    '0px 46px 96px rgba(0,0,0,0.10)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingTop: 10, paddingBottom: 10 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
          '&:hover': { boxShadow: '0 6px 20px rgba(79, 70, 229, 0.5)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Authenticated routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
