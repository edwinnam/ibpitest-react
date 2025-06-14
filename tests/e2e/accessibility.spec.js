import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { loginAsTestUser } from './helpers/auth';

test.describe('Accessibility Tests', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });

  test('dashboard should be accessible', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true
    });
  });

  test('keyboard navigation should work', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // First focusable element should have focus
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test skip link
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('.skip-link').first();
    if (await skipLink.isVisible()) {
      await skipLink.click();
      
      // Main content should be focused
      const mainContent = await page.locator('#main-content');
      await expect(mainContent).toBeFocused();
    }
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = await emailInput.evaluate(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      return label ? label.textContent : input.getAttribute('aria-label');
    });
    expect(emailLabel).toBeTruthy();
    
    // Check password input has label
    const passwordInput = page.locator('input[type="password"]');
    const passwordLabel = await passwordInput.evaluate(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      return label ? label.textContent : input.getAttribute('aria-label');
    });
    expect(passwordLabel).toBeTruthy();
  });

  test('images should have alt text', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    
    // Find all images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Decorative images should have empty alt=""
      // Informative images should have descriptive alt text
      expect(alt !== null).toBeTruthy();
    }
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/login');
    await injectAxe(page);
    
    // Check specifically for color contrast issues
    const results = await page.evaluate(() => {
      return window.axe.run({
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
  });

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to first input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focused element has visible focus indicator
    const focusedElement = page.locator(':focus');
    const focusStyle = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      focusStyle.outline !== 'none' || 
      focusStyle.boxShadow !== 'none' || 
      focusStyle.border !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('ARIA landmarks should be present', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    
    // Check for main landmark
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    
    // Check for navigation landmark
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    
    // Check for banner landmark (header)
    await expect(page.locator('header, [role="banner"]')).toBeVisible();
  });

  test('error messages should be accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');
    
    // Error message should be associated with input
    const errorMessage = page.locator('.error-message, .invalid-feedback').first();
    if (await errorMessage.isVisible()) {
      const errorId = await errorMessage.getAttribute('id');
      
      // Check if input has aria-describedby pointing to error
      const emailInput = page.locator('input[type="email"]');
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      
      if (errorId && ariaDescribedBy) {
        expect(ariaDescribedBy).toContain(errorId);
      }
    }
  });

  test('modal dialogs should trap focus', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/test-management');
    
    // Look for a button that opens a modal
    const modalTrigger = page.locator('button').filter({ hasText: /추가|생성|신규/ }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // Wait for modal to open
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        // Tab through elements
        let tabCount = 0;
        const maxTabs = 20;
        
        while (tabCount < maxTabs) {
          await page.keyboard.press('Tab');
          tabCount++;
          
          // Check if focus is still within modal
          const focusedElement = await page.evaluate(() => {
            const modal = document.querySelector('.modal, [role="dialog"]');
            return modal && modal.contains(document.activeElement);
          });
          
          expect(focusedElement).toBeTruthy();
          
          // Check if we've cycled back to the first element
          const currentFocus = await page.evaluate(() => document.activeElement.tagName);
          if (tabCount > 5 && currentFocus === 'BUTTON') {
            break;
          }
        }
      }
    }
  });
});