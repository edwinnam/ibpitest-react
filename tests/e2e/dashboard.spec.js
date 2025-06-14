import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
  });

  test('should display dashboard elements correctly', async ({ page }) => {
    // Check page header
    await expect(page.locator('h1')).toContainText('대시보드');
    
    // Check statistics cards
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('text=전체 검사')).toBeVisible();
    await expect(page.locator('text=완료된 검사')).toBeVisible();
    await expect(page.locator('text=진행 중')).toBeVisible();
    await expect(page.locator('text=검사 코드')).toBeVisible();
    
    // Check quick access section
    await expect(page.locator('.quick-access-section')).toBeVisible();
    await expect(page.locator('text=빠른 실행')).toBeVisible();
  });

  test('should navigate to test management from quick access', async ({ page }) => {
    // Click on "새 검사 생성" button
    await page.click('button:has-text("새 검사 생성")');
    
    // Should navigate to test management page
    await expect(page).toHaveURL('/test-management');
  });

  test('should navigate to test results from quick access', async ({ page }) => {
    // Click on "결과 보기" button
    await page.click('button:has-text("결과 보기")');
    
    // Should navigate to test results page
    await expect(page).toHaveURL('/test-results');
  });

  test('should display recent activities', async ({ page }) => {
    // Check recent activity section
    await expect(page.locator('.recent-activity-section')).toBeVisible();
    await expect(page.locator('text=최근 활동')).toBeVisible();
    
    // Activity list should exist (may be empty)
    const activityList = page.locator('.activity-list');
    const emptyState = page.locator('.empty-state');
    
    // Either activity list or empty state should be visible
    const hasActivities = await activityList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasActivities || isEmpty).toBeTruthy();
  });

  test('should display analytics dashboard', async ({ page }) => {
    // Scroll to analytics section
    await page.locator('text=검사 분석 대시보드').scrollIntoViewIfNeeded();
    
    // Check analytics components
    await expect(page.locator('.analytics-dashboard')).toBeVisible();
    await expect(page.locator('.summary-cards')).toBeVisible();
    await expect(page.locator('.charts-grid')).toBeVisible();
  });

  test('should change date range in analytics', async ({ page }) => {
    // Find date range selector
    const dateRangeSelect = page.locator('.date-range-select').first();
    
    // Change to 7 days
    await dateRangeSelect.selectOption('7days');
    await expect(dateRangeSelect).toHaveValue('7days');
    
    // Change to 1 year
    await dateRangeSelect.selectOption('1year');
    await expect(dateRangeSelect).toHaveValue('1year');
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that sidebar is hidden by default
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).not.toHaveClass(/open/);
    
    // Click menu toggle
    await page.click('.menu-toggle');
    
    // Sidebar should be visible
    await expect(sidebar).toHaveClass(/open/);
    
    // Click close button
    await page.click('.sidebar .close-btn');
    
    // Sidebar should be hidden again
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('should display organization info', async ({ page }) => {
    // Check organization info in header
    const orgInfo = page.locator('.org-info');
    await expect(orgInfo).toBeVisible();
    await expect(orgInfo).toContainText('기관명:');
    
    // Check code info
    const codeInfo = page.locator('.code-info');
    await expect(codeInfo).toBeVisible();
    await expect(codeInfo).toContainText('보유코드수:');
  });
});