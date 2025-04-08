import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';
import { SettingsProfilePage } from '../pages/settings-profile-page';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Settings Profile Page Accessibility Tests', () => {
  let settingsProfilePage: SettingsProfilePage;

  test.beforeEach(async ({ page }) => {
    settingsProfilePage = new SettingsProfilePage(page);
    await settingsProfilePage.navigateTo();
  });

  test('@Negative - Profile page should comply with WCAG 2.1 AA standards', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Run accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Output violation count for debugging
    console.log(`Detected ${accessibilityScanResults.violations.length} accessibility issues`);
    
    // If there are violations, output detailed information
    if (accessibilityScanResults.violations.length > 0) {
      for (const violation of accessibilityScanResults.violations) {
        console.log(`\nIssue: ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`WCAG: ${violation.tags.filter(tag => tag.startsWith('wcag')).join(', ')}`);
        console.log(`Affected elements: ${violation.nodes.length}`);
        
        // Output details for the first 3 affected elements
        violation.nodes.slice(0, 3).forEach((node, i) => {
          console.log(`\nElement ${i+1}:`);
          console.log(`HTML: ${node.html}`);
          console.log(`Locator: ${node.target}`);
          console.log(`Fix suggestion: ${node.failureSummary}`);
        });
      }
    }
    
    // Verify there are no serious or critical accessibility issues
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(criticalViolations.length, 
      `Found ${criticalViolations.length} serious accessibility issues`).toBe(0);
    
    // Log warning level issues, but don't fail the test
    const warningViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'moderate' || v.impact === 'minor'
    );
    
    if (warningViolations.length > 0) {
      console.log(`\nWarning: Found ${warningViolations.length} moderate or minor accessibility issues`);
    }
  });

  test('Profile form elements should have proper labels and descriptions', async ({ page }) => {
    // Check if form fields have appropriate labels
    const formFields = [
      { name: 'Name', selector: 'input[name="name"]' },
      { name: 'Bio', selector: 'textarea[name="bio"]' },
      { name: 'Github profile', selector: 'input[name="github"]' },
      { name: 'Linkedin profile', selector: 'input[name="linkedin"]' },
      { name: 'Twitter profile', selector: 'input[name="twitter"]' }
    ];
    
    for (const field of formFields) {
      // Check if the field exists
      const fieldElement = page.locator(field.selector);
      await expect(fieldElement).toBeVisible();
      
      // Check if the field has a label
      const hasLabel = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        
        // Check for aria-label attribute
        if (el.getAttribute('aria-label')) return true;
        
        // Check for associated label element
        const id = el.id;
        if (id && document.querySelector(`label[for="${id}"]`)) return true;
        
        // Check if parent element is a label
        return el.closest('label') !== null;
      }, field.selector);
      
      expect(hasLabel, `${field.name} field is missing an accessible label`).toBeTruthy();
    }
    
    // Check if the submit button is accessible
    const updateButton = page.getByRole('button', { name: 'Update' });
    await expect(updateButton).toBeVisible();
    
    // Check if the button has an accessible name
    const buttonName = await updateButton.getAttribute('aria-label') || 
                       await updateButton.textContent();
    expect(buttonName, 'Update button is missing an accessible name').toBeTruthy();
  });

  test('Profile page should support keyboard navigation', async ({ page }) => {
    // Set focus to the page
    await page.focus('body');
    
    // Define element type
    interface TabbableElement {
      tag: string;
      type: string | null;
      name: string | null;
      text: string | undefined;
    }

    // Simulate user navigating the page with Tab key
    const tabbableElements: Array<{
      tag: string;
      type: string | null;
      name: string | null;
      text: string | undefined;
    }> = [];
    
    // Press Tab key until we cycle back to the start or reach maximum count
    const maxTabs = 20; // Prevent infinite loop
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      
      // Get current focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? {
          tag: el.tagName,
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          text: el.textContent?.trim().substring(0, 50)
        } : null;
      });
      
      if (focusedElement) {
        tabbableElements.push(focusedElement);
      }
    }
    
    // Verify all important elements can be accessed via keyboard
    console.log('Elements accessible via Tab key:', tabbableElements);
    
    // Check if all form fields are accessible
    const formFieldNames = ['name', 'bio', 'github', 'linkedin', 'twitter'];
    const accessibleFields = formFieldNames.filter(name => 
      tabbableElements.some(el => el.name === name)
    );
    
    expect(accessibleFields.length, `Only ${accessibleFields.length}/${formFieldNames.length} form fields are keyboard accessible`).toBe(formFieldNames.length);
    
    // Check if submit button is accessible
    const canAccessSubmitButton = tabbableElements.some(el => 
      (el.tag === 'BUTTON' && el.text?.includes('Update')) ||
      (el.tag === 'INPUT' && el.type === 'submit')
    );
    
    expect(canAccessSubmitButton, 'Submit button is not keyboard accessible').toBeTruthy();
  });
}); 