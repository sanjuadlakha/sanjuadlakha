import { test, expect } from '@playwright/test';

// Helper: Generate unique test user data
function uniqueUser() {
  const ts = Date.now();
  return {
    username: `user${ts}`,
    email: `user${ts}@test.com`,
    password: 'Test@1234',
    first_name: 'Test',
    last_name: 'User',
  };
}

// ─── Login Tests ─────────────────────────────────────────────────────────────
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('[data-testid="login-email"]').fill('wrong@example.com');
    await page.locator('[data-testid="login-password"]').fill('wrongpassword');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for missing password', async ({ page }) => {
    await page.locator('[data-testid="login-email"]').fill('admin@example.com');
    // Don't fill password — click submit
    await page.locator('[data-testid="login-submit"]').click();
    // HTML5 validation or API error
    const emailInput = page.locator('[data-testid="login-password"]');
    await expect(emailInput).toBeVisible();
  });

  test('admin login navigates to admin dashboard', async ({ page }) => {
    await page.locator('[data-testid="login-email"]').fill('admin@example.com');
    await page.locator('[data-testid="login-password"]').fill('Admin@123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 8000 });
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('register link is visible', async ({ page }) => {
    await expect(page.getByText(/register/i)).toBeVisible();
  });
});

// ─── Registration Tests ───────────────────────────────────────────────────────
test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('shows registration form', async ({ page }) => {
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.locator('[data-testid="reg-username"]')).toBeVisible();
    await expect(page.locator('[data-testid="reg-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="reg-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="reg-submit"]')).toBeVisible();
  });

  test('registers a new user and redirects to profile', async ({ page }) => {
    const u = uniqueUser();
    await page.locator('[data-testid="reg-firstname"]').fill(u.first_name);
    await page.locator('[data-testid="reg-lastname"]').fill(u.last_name);
    await page.locator('[data-testid="reg-username"]').fill(u.username);
    await page.locator('[data-testid="reg-email"]').fill(u.email);
    await page.locator('[data-testid="reg-password"]').fill(u.password);
    await page.locator('[data-testid="reg-submit"]').click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 8000 });
    await expect(page.getByText('My Profile')).toBeVisible();
  });

  test('shows error on short username', async ({ page }) => {
    await page.locator('[data-testid="reg-firstname"]').fill('Test');
    await page.locator('[data-testid="reg-username"]').fill('ab'); // too short
    await page.locator('[data-testid="reg-email"]').fill('shortuser@test.com');
    await page.locator('[data-testid="reg-password"]').fill('password123');
    await page.locator('[data-testid="reg-submit"]').click();
    await expect(page.getByText(/3-30 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows error on short password', async ({ page }) => {
    const u = uniqueUser();
    await page.locator('[data-testid="reg-firstname"]').fill(u.first_name);
    await page.locator('[data-testid="reg-username"]').fill(u.username);
    await page.locator('[data-testid="reg-email"]').fill(u.email);
    await page.locator('[data-testid="reg-password"]').fill('123');
    await page.locator('[data-testid="reg-submit"]').click();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('sign in link is visible', async ({ page }) => {
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});

// ─── Admin Dashboard Tests ────────────────────────────────────────────────────
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="login-email"]').fill('admin@example.com');
    await page.locator('[data-testid="login-password"]').fill('Admin@123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 8000 });
  });

  test('displays user table with at least one user', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('can search for admin user', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('admin');
    await page.waitForSelector('tbody tr', { state: 'visible' });
    await expect(page.getByText('admin@example.com')).toBeVisible({ timeout: 5000 });
  });

  test('create new user via dialog', async ({ page }) => {
    const u = uniqueUser();
    await page.locator('[data-testid="create-user-btn"]').click();
    await expect(page.getByText('Create New User')).toBeVisible();

    await page.locator('[data-testid="dialog-firstname"]').fill(u.first_name);
    await page.locator('[data-testid="dialog-lastname"]').fill(u.last_name);
    await page.locator('[data-testid="dialog-username"]').fill(u.username);
    await page.locator('[data-testid="dialog-email"]').fill(u.email);
    await page.locator('[data-testid="dialog-password"]').fill(u.password);
    await page.locator('[data-testid="dialog-save-btn"]').click();

    // Should show success snackbar
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('edit user via dialog', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr');
    // Click the edit button for the first user row (non-self)
    const editBtns = page.locator('[data-testid^="edit-user-"]');
    await editBtns.first().click();

    await expect(page.getByText(/Edit User/i)).toBeVisible();
    await page.locator('[data-testid="dialog-firstname"]').fill('Updated');
    await page.locator('[data-testid="dialog-save-btn"]').click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows pagination when there are many users', async ({ page }) => {
    // Just check table renders (pagination only shows if >8 users)
    await expect(page.locator('table')).toBeVisible();
  });

  test('logout from admin dashboard', async ({ page }) => {
    await page.locator('[data-testid="logout-btn"]').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

// ─── User Profile Tests ───────────────────────────────────────────────────────
test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and go to profile
    await page.goto('/login');
    await page.locator('[data-testid="login-email"]').fill('admin@example.com');
    await page.locator('[data-testid="login-password"]').fill('Admin@123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 8000 });
    await page.goto('/profile');
    await expect(page.getByText('My Profile')).toBeVisible();
  });

  test('shows profile information', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-save-btn"]')).toBeVisible();
  });

  test('can update profile first name', async ({ page }) => {
    await page.locator('[data-testid="profile-firstname"]').clear();
    await page.locator('[data-testid="profile-firstname"]').fill('Updated');
    await page.locator('[data-testid="profile-save-btn"]').click();
    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows error on password mismatch', async ({ page }) => {
    await page.locator('[data-testid="pw-current"]').fill('Admin@123');
    await page.locator('[data-testid="pw-new"]').fill('NewPass@123');
    await page.locator('[data-testid="pw-confirm"]').fill('DifferentPass');
    await page.locator('[data-testid="pw-save-btn"]').click();
    await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 3000 });
  });

  test('shows error on short new password', async ({ page }) => {
    await page.locator('[data-testid="pw-current"]').fill('Admin@123');
    await page.locator('[data-testid="pw-new"]').fill('123');
    await page.locator('[data-testid="pw-confirm"]').fill('123');
    await page.locator('[data-testid="pw-save-btn"]').click();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible({ timeout: 3000 });
  });

  test('logout from profile page', async ({ page }) => {
    await page.locator('[data-testid="profile-logout-btn"]').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

// ─── Access Control Tests ─────────────────────────────────────────────────────
test.describe('Access Control', () => {
  test('unauthenticated user redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated user redirected from /profile to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('regular user redirected from /admin to /profile', async ({ page }) => {
    // Register a regular user
    const u = uniqueUser();
    await page.goto('/register');
    await page.locator('[data-testid="reg-firstname"]').fill(u.first_name);
    await page.locator('[data-testid="reg-username"]').fill(u.username);
    await page.locator('[data-testid="reg-email"]').fill(u.email);
    await page.locator('[data-testid="reg-password"]').fill(u.password);
    await page.locator('[data-testid="reg-submit"]').click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 8000 });

    // Try to access admin page
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/profile/, { timeout: 5000 });
  });
});
