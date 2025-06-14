import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Test Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/test-management');
  });

  test('should display test management tabs', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('검사 관리');
    
    // Check tabs
    await expect(page.locator('.nav-tabs')).toBeVisible();
    await expect(page.locator('text=코드 생성')).toBeVisible();
    await expect(page.locator('text=발송 대기')).toBeVisible();
    await expect(page.locator('text=발송/진행/완료')).toBeVisible();
  });

  test('should generate test codes', async ({ page }) => {
    // Click code generation tab
    await page.click('text=코드 생성');
    
    // Check form elements
    await expect(page.locator('select[name="testType"]')).toBeVisible();
    await expect(page.locator('input[name="count"]')).toBeVisible();
    await expect(page.locator('button:has-text("코드 생성")')).toBeVisible();
    
    // Select test type
    await page.selectOption('select[name="testType"]', 'adult');
    
    // Enter count
    await page.fill('input[name="count"]', '5');
    
    // Generate codes
    await page.click('button:has-text("코드 생성")');
    
    // Should show success message or generated codes
    await expect(page.locator('.alert-success, .generated-codes')).toBeVisible({ timeout: 10000 });
  });

  test('should send test codes via SMS', async ({ page }) => {
    // Click waiting tab
    await page.click('text=발송 대기');
    
    // If there are codes waiting
    const codeRows = page.locator('.code-waiting-table tbody tr');
    const rowCount = await codeRows.count();
    
    if (rowCount > 0) {
      // Click send button on first row
      await codeRows.first().locator('button:has-text("발송")').click();
      
      // Modal should appear
      await expect(page.locator('.modal')).toBeVisible();
      
      // Fill customer info
      await page.fill('input[name="name"]', '테스트 고객');
      await page.fill('input[name="phone"]', '01012345678');
      await page.selectOption('select[name="gender"]', '남');
      await page.fill('input[name="birthDate"]', '1990-01-01');
      
      // Send
      await page.click('button:has-text("문자 발송")');
      
      // Should show success message
      await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display completed tests', async ({ page }) => {
    // Click completed tab
    await page.click('text=발송/진행/완료');
    
    // Check table structure
    await expect(page.locator('.code-complete-table')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th:has-text("검사코드")')).toBeVisible();
    await expect(page.locator('th:has-text("이름")')).toBeVisible();
    await expect(page.locator('th:has-text("연락처")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
  });

  test('should filter test codes', async ({ page }) => {
    // Click completed tab
    await page.click('text=발송/진행/완료');
    
    // Check filter options
    const statusFilter = page.locator('select.status-filter');
    if (await statusFilter.isVisible()) {
      // Filter by completed status
      await statusFilter.selectOption('완료');
      
      // Check that table updates (wait for potential API call)
      await page.waitForTimeout(1000);
      
      // All visible status badges should show "완료"
      const statusBadges = page.locator('.status-badge:visible');
      const count = await statusBadges.count();
      
      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toContainText('완료');
      }
    }
  });

  test('should search test codes', async ({ page }) => {
    // Click completed tab
    await page.click('text=발송/진행/완료');
    
    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill('테스트');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Check that results are filtered
      const tableRows = page.locator('.code-complete-table tbody tr:visible');
      const rowCount = await tableRows.count();
      
      // If there are results, they should contain search term
      if (rowCount > 0) {
        const firstRowText = await tableRows.first().textContent();
        expect(firstRowText.toLowerCase()).toContain('테스트');
      }
    }
  });

  test('should export test data', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("내보내기"), button:has-text("Export")');
    
    if (await exportButton.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      
      // Click export
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download).toBeTruthy();
      
      // Check filename contains expected format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.(xlsx|csv|xls)$/);
    }
  });
});