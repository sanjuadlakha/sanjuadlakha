import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import {
  Box, Button, Chip, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, InputAdornment,
  MenuItem, Paper, Select, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
  Pagination, FormControl, InputLabel, Avatar, Card, CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LayersIcon from '@mui/icons-material/Layers';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const EMPTY_FORM = {
  username: '', email: '', password: '', role: 'user',
  first_name: '', last_name: '', is_active: 1,
};

function StatCard({ icon, label, value, gradient }) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 4,
          background: gradient,
        }}
      />
      <CardContent sx={{ pt: 3, pb: '20px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" lineHeight={1}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5} fontWeight={500}>
              {label}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              background: gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({
        page,
        limit: 8,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {
      showSnack('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setDialog({ open: true, mode: 'create', data: null });
  };

  const openEdit = (u) => {
    setForm({
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      is_active: u.is_active,
    });
    setFormError('');
    setDialog({ open: true, mode: 'edit', data: u });
  };

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setFormError('');
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await usersApi.create(form);
        showSnack('User created successfully');
      } else {
        const { password: _password, username: _username, ...updateData } = form;
        await usersApi.update(dialog.data.id, updateData);
        showSnack('User updated successfully');
      }
      closeDialog();
      fetchUsers();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setFormError(apiErrors.map((e) => e.msg).join('. '));
      } else {
        setFormError(err.response?.data?.message || 'Operation failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"? This is a soft delete.`)) return;
    try {
      await usersApi.delete(u.id);
      showSnack('User deleted');
      fetchUsers();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Delete failed', 'error');
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
            <ManageAccountsIcon sx={{ color: 'white', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} color="white">
              User Management
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 34, height: 34,
                background: 'rgba(255,255,255,0.25)',
                fontSize: 14, fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.5)',
              }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="white" fontWeight={500}>
              {user?.username}
            </Typography>
            <Tooltip title="My Profile">
              <IconButton size="small" onClick={() => navigate('/profile')} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <PersonIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout} data-testid="logout-btn" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={2.5} mb={4}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<PeopleIcon sx={{ color: 'white', fontSize: 24 }} />}
              label="Total Users"
              value={pagination.total}
              gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />}
              label="Active (this page)"
              value={users.filter((u) => u.is_active).length}
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<LayersIcon sx={{ color: 'white', fontSize: 24 }} />}
              label="Total Pages"
              value={pagination.totalPages}
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
          </Grid>
        </Grid>

        {/* Toolbar */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small" placeholder="Search users…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
              sx={{ width: 260 }}
              inputProps={{ 'data-testid': 'search-input' }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role" value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                data-testid="role-filter"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
            <Box flexGrow={1} />
            <Tooltip title="Refresh">
              <IconButton onClick={fetchUsers}><RefreshIcon /></IconButton>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={openCreate} data-testid="create-user-btn"
            >
              New User
            </Button>
          </Box>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8faff' }}>
                  {['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(
                    (h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 700,
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                        }}
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{u.id}</TableCell>
                      <TableCell fontWeight={500}>
                        {u.first_name} {u.last_name}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role} size="small"
                          color={u.role === 'admin' ? 'secondary' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={u.is_active ? 'success' : 'error'}
                          variant={u.is_active ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small" onClick={() => openEdit(u)}
                            data-testid={`edit-user-${u.id}`}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {u.id !== user?.id && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small" color="error"
                              onClick={() => handleDelete(u)}
                              data-testid={`delete-user-${u.id}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={pagination.totalPages} page={page}
              onChange={(_, p) => setPage(p)} color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Container>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          {dialog.mode === 'create' ? 'Create New User' : `Edit User: ${dialog.data?.username}`}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="First Name" name="first_name"
                value={form.first_name} onChange={handleFormChange}
                inputProps={{ 'data-testid': 'dialog-firstname' }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Last Name" name="last_name"
                value={form.last_name} onChange={handleFormChange}
                inputProps={{ 'data-testid': 'dialog-lastname' }}
              />
            </Grid>
            {dialog.mode === 'create' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth required label="Username" name="username"
                  value={form.username} onChange={handleFormChange}
                  inputProps={{ 'data-testid': 'dialog-username' }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth required label="Email" name="email" type="email"
                value={form.email} onChange={handleFormChange}
                inputProps={{ 'data-testid': 'dialog-email' }}
              />
            </Grid>
            {dialog.mode === 'create' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth required label="Password" name="password" type="password"
                  value={form.password} onChange={handleFormChange}
                  inputProps={{ 'data-testid': 'dialog-password' }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role" name="role"
                  value={form.role} onChange={handleFormChange}
                  inputProps={{ 'data-testid': 'dialog-role' }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {dialog.mode === 'edit' && (
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status" name="is_active"
                    value={form.is_active} onChange={handleFormChange}
                    inputProps={{ 'data-testid': 'dialog-status' }}
                  >
                    <MenuItem value={1}>Active</MenuItem>
                    <MenuItem value={0}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeDialog} variant="outlined" color="inherit">Cancel</Button>
          <Button
            variant="contained" onClick={handleSave} disabled={saving}
            data-testid="dialog-save-btn"
          >
            {saving ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

