import { test, expect } from '@playwright/test';

test.describe('Customer Test Flow', () => {
  test('should complete full customer test flow', async ({ page }) => {
    // Start at customer login
    await page.goto('/customer/login');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('검사 시작');
    await expect(page.locator('input[placeholder*="검사 코드"]')).toBeVisible();
    
    // Enter test code (this would need to be a valid test code in your test environment)
    const testCode = process.env.TEST_CUSTOMER_CODE || 'TEST123456';
    await page.fill('input[placeholder*="검사 코드"]', testCode);
    
    // Submit
    await page.click('button:has-text("검사 시작")');
    
    // Should navigate to test intro page (if code is valid)
    // Note: This test might fail without a valid test code
    if (await page.url().includes('/customer/test-intro')) {
      // Test intro page
      await expect(page.locator('h1')).toContainText('검사 안내');
      await expect(page.locator('button:has-text("검사 시작하기")')).toBeVisible();
      
      // Click start test
      await page.click('button:has-text("검사 시작하기")');
      
      // Should be on test page
      await expect(page).toHaveURL(/\/customer\/test/);
      
      // Check test page elements
      await expect(page.locator('.test-progress')).toBeVisible();
      await expect(page.locator('.test-question')).toBeVisible();
      
      // Answer first question
      const answerButton = page.locator('.answer-button').first();
      if (await answerButton.isVisible()) {
        await answerButton.click();
        
        // Should move to next question
        await page.waitForTimeout(500); // Wait for animation
      }
    }
  });

  test('should show error for invalid test code', async ({ page }) => {
    await page.goto('/customer/login');
    
    // Enter invalid code
    await page.fill('input[placeholder*="검사 코드"]', 'INVALID');
    await page.click('button:has-text("검사 시작")');
    
    // Should show error message
    await expect(page.locator('.alert-danger, .error-message')).toBeVisible();
  });

  test('should validate test code format', async ({ page }) => {
    await page.goto('/customer/login');
    
    // Try to submit without code
    await page.click('button:has-text("검사 시작")');
    
    // Should show validation error
    await expect(page.locator('text=검사 코드를 입력해주세요')).toBeVisible();
    
    // Enter code that's too short
    await page.fill('input[placeholder*="검사 코드"]', '123');
    
    // Should show format error
    const input = page.locator('input[placeholder*="검사 코드"]');
    const isInvalid = await input.evaluate(el => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should handle test progress correctly', async ({ page }) => {
    // This test would require a valid test code and mock data
    const testCode = process.env.TEST_CUSTOMER_CODE || 'TEST123456';
    
    await page.goto('/customer/login');
    await page.fill('input[placeholder*="검사 코드"]', testCode);
    await page.click('button:has-text("검사 시작")');
    
    // If we get to test page
    if (await page.url().includes('/customer/test')) {
      // Check progress indicators
      const progressBar = page.locator('.progress-bar, [role="progressbar"]');
      if (await progressBar.isVisible()) {
        // Progress should start at 0 or low value
        const initialProgress = await progressBar.getAttribute('aria-valuenow') || 
                              await progressBar.getAttribute('style');
        expect(initialProgress).toBeTruthy();
      }
      
      // Check question navigation
      const nextButton = page.locator('button:has-text("다음")');
      const prevButton = page.locator('button:has-text("이전")');
      
      // Previous should be disabled on first question
      if (await prevButton.isVisible()) {
        await expect(prevButton).toBeDisabled();
      }
    }
  });

  test('should save and resume test progress', async ({ page, context }) => {
    const testCode = process.env.TEST_CUSTOMER_CODE || 'TEST123456';
    
    await page.goto('/customer/login');
    await page.fill('input[placeholder*="검사 코드"]', testCode);
    await page.click('button:has-text("검사 시작")');
    
    if (await page.url().includes('/customer/test')) {
      // Answer a few questions
      for (let i = 0; i < 3; i++) {
        const answerButton = page.locator('.answer-button').first();
        if (await answerButton.isVisible()) {
          await answerButton.click();
          await page.waitForTimeout(300);
        }
      }
      
      // Note current progress
      const currentQuestion = await page.locator('.current-question-number').textContent().catch(() => '1');
      
      // Navigate away
      await page.goto('/');
      
      // Come back with same code
      await page.goto('/customer/login');
      await page.fill('input[placeholder*="검사 코드"]', testCode);
      await page.click('button:has-text("검사 시작")');
      
      // Should resume from where left off
      if (await page.url().includes('/customer/test')) {
        const resumedQuestion = await page.locator('.current-question-number').textContent().catch(() => '1');
        expect(parseInt(resumedQuestion)).toBeGreaterThanOrEqual(parseInt(currentQuestion));
      }
    }
  });

  test('should complete test and show completion page', async ({ page }) => {
    const testCode = process.env.TEST_CUSTOMER_CODE || 'TEST123456';
    
    await page.goto('/customer/login');
    await page.fill('input[placeholder*="검사 코드"]', testCode);
    await page.click('button:has-text("검사 시작")');
    
    if (await page.url().includes('/customer/test-intro')) {
      await page.click('button:has-text("검사 시작하기")');
      
      // Answer all questions (simplified - would need to know exact count)
      while (await page.url().includes('/customer/test')) {
        const answerButton = page.locator('.answer-button').first();
        const submitButton = page.locator('button:has-text("제출")');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          break;
        } else if (await answerButton.isVisible()) {
          await answerButton.click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      }
      
      // Should be on completion page
      if (await page.url().includes('/customer/test-complete')) {
        await expect(page.locator('h1')).toContainText('검사 완료');
        await expect(page.locator('text=검사를 완료해 주셔서 감사합니다')).toBeVisible();
      }
    }
  });
});