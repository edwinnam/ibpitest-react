import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/IBPI/);
    
    // Check login form elements
    await expect(page.locator('h1')).toContainText('로그인');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check links
    await expect(page.locator('text=비밀번호를 잊으셨나요?')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling fields
    await page.locator('button[type="submit"]').click();
    
    // Check for validation messages
    await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use test credentials (these should be set up in your test environment)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('대시보드');
  });

  test('should navigate to password reset page', async ({ page }) => {
    // Click forgot password link
    await page.click('text=비밀번호를 잊으셨나요?');
    
    // Should be on reset password page
    await expect(page).toHaveURL('/reset-password');
    await expect(page.locator('h1')).toContainText('비밀번호 재설정');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    
    // Click logout button
    await page.click('button:has-text("로그아웃")');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should persist login session', async ({ page, context }) => {
    // Login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL('/dashboard');
    
    // Open new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should still be logged in
    await expect(newPage).toHaveURL('/dashboard');
    await expect(newPage.locator('h1')).toContainText('대시보드');
  });
});