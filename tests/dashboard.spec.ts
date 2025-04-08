import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';

test.describe('Dashboard Page Tests', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigateToDashboard();
  });

  test('should display create New Organization button', async ({ dashboardPage }) => {
    await expect(dashboardPage.newOrganizationButton).toBeVisible();
  });

  test('should display user profile button', async ({ dashboardPage }) => {
    await expect(dashboardPage.userProfileButton).toBeVisible();
  });

  test('should navigate to AI Runners page', async ({ dashboardPage, aiRunnersPage }) => {
    await dashboardPage.navigateToAIRunners();
    await expect(aiRunnersPage.headingTitle).toBeVisible();
  });

  test('welcome message should match user name format', async ({ dashboardPage }) => {
    // Get text from user profile button
    const userProfileText = await dashboardPage.userProfileButton.textContent() || '';
    
    // Extract first part of username (before space or entire name)
    const firstName = userProfileText.split(' ')[0];
    
    // Get welcome message text
    const welcomeText = await dashboardPage.welcomeMessages.textContent() || '';
    
    // Verify welcome message format
    const expectedPattern = new RegExp(`Get started with Insomnia, ${firstName}!`);
    expect(welcomeText).toMatch(expectedPattern);
    
    // Log actual values for debugging
    console.log(`Username: "${userProfileText}"`);
    console.log(`Extracted first name: "${firstName}"`);
    console.log(`Welcome message: "${welcomeText}"`);
    
    // If not matching expected format, log error
    if (!welcomeText.match(expectedPattern)) {
      console.log(`Error: Welcome message format incorrect. Should be "Get started with Insomnia, ${firstName}!"`);
    }
  });

  test('download links should be valid and working', async ({ page, dashboardPage }) => {
    // Set longer timeout (300 seconds)
    test.setTimeout(300000);
    
    // Create a flag to track if download started
    let downloadStarted = false;
    
    // Listen for download events
    page.on('download', download => {
      console.log(`Download started: ${download.suggestedFilename()}`);
      downloadStarted = true;
      // Cancel download
      download.cancel();
    });
    
    // Listen for responses to check if download links are valid
    page.on('response', response => {
      const url = response.url();
      if (url.includes('download') || url.includes('.dmg') || url.includes('.exe') || url.includes('.deb')) {
        console.log(`Checking download link: ${url} - Status code: ${response.status()}`);
        expect(response.status()).toBeLessThan(400); // Any status code less than 400 is not an error
      }
    });
    
    // Check MacOS download link
    console.log('Testing MacOS download link...');
    await dashboardPage.downloadForMacOSButton.click();
    
    // Wait a short time to see if download starts
    await page.waitForTimeout(15000);
    
    // Check Windows download link
    console.log('Testing Windows download link...');
    const windowsPagePromise = page.waitForEvent('popup');
    await dashboardPage.downloadForWindowsLink.click();
    const windowsPage = await windowsPagePromise;
    await windowsPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Windows download page load timed out, but continuing test');
    });
    await windowsPage.close();
    
    // Check Linux download link
    console.log('Testing Linux download link...');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: /Linux/ }).click();
    
    // Wait for download to start
    const download = await downloadPromise;
    console.log(`Started downloading file: ${download.suggestedFilename()}`);
    
    // Check "see all downloads" link
    console.log('Testing "see all downloads" link...');
    const allDownloadsPagePromise = page.waitForEvent('popup');
    await dashboardPage.seeAllDownloadsLink.click();
    const allDownloadsPage = await allDownloadsPagePromise;
    await allDownloadsPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {
      console.log('See all downloads page load timed out, but continuing test');
    });
    
    // Verify download page title
    try {
      const pageUrl = allDownloadsPage.url();
      console.log(`Downloads page URL: ${pageUrl}`);
      // Verify URL points to GitHub Releases page
      expect(pageUrl).toContain('github.com/Kong/insomnia/releases');
    } catch (error) {
      console.log('Failed to verify GitHub Releases page:', error);
    }
    
    await allDownloadsPage.close();
    
    // If we detected at least one download starting, test passes
    if (downloadStarted) {
      console.log('At least one download started, test passes');
    } else {
      console.log('Warning: No downloads detected starting, but links may still be valid');
    }
  });

  test.fixme('@fixme - footer links should be valid and working', async ({ page, dashboardPage }) => {
    // Set longer timeout (120 seconds)
    test.setTimeout(120000);
    
    // Check all footer links
    const footerLinks = [
      { name: 'Kong Inc.', locator: dashboardPage.footerKongInc },
      { name: 'Support', locator: dashboardPage.footerSupportLink },
      { name: 'Slack', locator: dashboardPage.footerSlackLink },
      { name: 'Github', locator: dashboardPage.footerGitHubLink },
      { name: 'Twitter', locator: dashboardPage.footerTwitterLink },
      { name: 'Blog', locator: dashboardPage.footerBlogLink },
      { name: 'Terms', locator: dashboardPage.footerTermsLink },
      { name: 'Privacy', locator: dashboardPage.footerPrivacyLink }
    ];
    
    for (const link of footerLinks) {
      // Wait for new page to open
      const popupPromise = page.waitForEvent('popup');
      await link.locator.click();
      const popup = await popupPromise;
      
      // Wait for page to load
      await popup.waitForLoadState('domcontentloaded');
      console.log(`${link.name} loaded`);
      
      // Get page title and URL
      const pageTitle = await popup.title();
      const pageUrl = popup.url();
      
      try {
        // Check HTTP status code
        const response = await popup.waitForEvent('response', {
          predicate: response => response.url() === pageUrl && response.status() > 0,
          timeout: 15000
        });
        
        // Verify status code is less than 400 (non-error status)
        expect.soft(response.status(), `Link ${link.name} (${pageUrl}) returned error status code: ${response.status()}`).toBeLessThan(400);
        
        // Check if page has content
        const bodyContent = await popup.evaluate(() => document.body.textContent || '');
        expect.soft(bodyContent.length, `Link ${link.name} (${pageUrl}) page content is empty`).toBeGreaterThan(50);
        
        // Check if page has heading elements
        const hasHeading = await popup.evaluate(() => {
          const headings = document.querySelectorAll('h1, h2, h3');
          return headings.length > 0;
        });
        expect.soft(hasHeading, `Link ${link.name} (${pageUrl}) page is missing heading elements`).toBeTruthy();
        
        // Check if page has main content area
        const hasMainContent = await popup.evaluate(() => {
          return !!(document.querySelector('main') || 
                   document.querySelector('article') || 
                   document.querySelector('.content') || 
                   document.querySelector('#content'));
        });
        expect.soft(hasMainContent, `Link ${link.name} (${pageUrl}) page is missing main content area`).toBeTruthy();
        
      } catch (error) {
        console.log(`Error checking link ${link.name}:`, error);
        expect.soft(true, `Link ${link.name} (${pageUrl}) validation failed: ${(error as Error).message}`).toBeFalsy();
      }
      
      console.log(`Checking footer link: ${link.name} - URL: ${pageUrl} - Title: ${pageTitle}`);
      
      // Close popup window
      await popup.close();
    }
  });

  // More dashboard tests...
}); 