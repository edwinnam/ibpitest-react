/**
 * Authentication helper functions for E2E tests
 */

/**
 * Login as test user
 * @param {import('@playwright/test').Page} page 
 */
export async function loginAsTestUser(page) {
  // Get test credentials from environment or use defaults
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'testpassword';
  
  // Go to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard');
}

/**
 * Login as admin user
 * @param {import('@playwright/test').Page} page 
 */
export async function loginAsAdmin(page) {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'adminpassword';
  
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

/**
 * Logout current user
 * @param {import('@playwright/test').Page} page 
 */
export async function logout(page) {
  // Click logout button
  await page.click('button:has-text("로그아웃")');
  
  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Check if user is logged in
 * @param {import('@playwright/test').Page} page 
 */
export async function isLoggedIn(page) {
  // Try to find logout button
  const logoutButton = page.locator('button:has-text("로그아웃")');
  return await logoutButton.isVisible().catch(() => false);
}

/**
 * Get current user info from page
 * @param {import('@playwright/test').Page} page 
 */
export async function getCurrentUserInfo(page) {
  // This would depend on where user info is displayed in your app
  const userInfo = {};
  
  // Example: Get organization name
  const orgInfo = page.locator('.org-info .value');
  if (await orgInfo.isVisible()) {
    userInfo.organization = await orgInfo.textContent();
  }
  
  return userInfo;
}