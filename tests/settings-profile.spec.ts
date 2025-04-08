import { time } from 'console';
import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';
import { SettingsProfilePage } from '../pages/settings-profile-page';

// Configure this test file to use a single worker
test.describe.configure({ 
  mode: 'serial',
  retries: 0  // Do not retry failed tests
});

test.describe('Settings Profile Page Tests', () => {
  let settingsProfilePage: SettingsProfilePage;

  test.beforeEach(async ({ page }) => {
    settingsProfilePage = new SettingsProfilePage(page);
    await settingsProfilePage.navigateTo();
  });

  test('Should display error message when name is empty', async ({ page }) => {
    // Save current name for restoration after test
    const originalName = await settingsProfilePage.getCurrentName();
    
    // Clear name field
    await settingsProfilePage.nameInput.clear();
    
    // Click update button
    await settingsProfilePage.updateButton.click();
    
    // Verify error message is displayed
    await expect(settingsProfilePage.nameCannotEmptyMsg).toBeVisible();
    
    // Restore original name
    await settingsProfilePage.updateProfile({ name: originalName });
  });


  test('Should successfully save GitHub profile update', async ({ page }) => {
    // Generate random GitHub username
    const githubUsername = `github-user-${Date.now()}`;
    const githubUrl = `https://github.com/${githubUsername}`;
    
    // Update GitHub profile
    await settingsProfilePage.updateProfile({ github: githubUrl });
    
    // Wait for update success message
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // Refresh page to verify changes were saved
    await page.reload();
    
    // Verify GitHub input contains new URL
    await expect(settingsProfilePage.githubInput).toHaveValue(githubUrl);
  });

  test('@Negative Name field can be set to contain only spaces', async ({ page }) => {
    // Save current name for restoration after test
    const originalName = await settingsProfilePage.getCurrentName();
    
    // Set name to two spaces
    await settingsProfilePage.nameInput.fill('  ');
    await settingsProfilePage.updateButton.click();
    
    // Wait for update to complete
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // Refresh page to verify changes were saved
    await page.reload();
    
    // Verify name field value is two spaces
    const currentName = await settingsProfilePage.nameInput.inputValue();
    expect(currentName).toBe('  ');
    console.log(`Name field was set to spaces: "${currentName}"`);
    
    // Restore original name
    await settingsProfilePage.updateProfile({ name: originalName });
  });

  test('@Negative Social media link validation is inconsistent', async ({ page }) => {
    // Save current values for restoration after test
    const originalGithub = await settingsProfilePage.githubInput.inputValue();
    const originalLinkedin = await settingsProfilePage.linkedinInput.inputValue();
    const originalTwitter = await settingsProfilePage.twitterInput.inputValue();
    
    // Set links without https:// prefix
    await settingsProfilePage.githubInput.fill('github.com/mustStartWithHttp');
    await settingsProfilePage.linkedinInput.fill('linkedin.com/in/mustStartWithHttp');
    await settingsProfilePage.twitterInput.fill('twitter.com/mustStartWithHttp');
    
    // Click update button
    await settingsProfilePage.updateButton.click();
    
    // Verify Twitter shows error message
    await expect(settingsProfilePage.twitterProfileInvalidMsg).toBeVisible();
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // Check if GitHub and LinkedIn should also show error messages
    const isGithubErrorVisible = await settingsProfilePage.githubProfileInvalidMsg.isVisible();
    const isLinkedinErrorVisible = await settingsProfilePage.linkedinProfileInvalidMsg.isVisible();
    
    console.log(`GitHub error message visible: ${isGithubErrorVisible}`);
    console.log(`LinkedIn error message visible: ${isLinkedinErrorVisible}`);
    console.log('Issue: If all social media links need to start with https://, validation should be consistent');
    
    // // Test correctly formatted links
    // await settingsProfilePage.githubInput.fill('https://github.com/correctUser');
    // await settingsProfilePage.linkedinInput.fill('https://linkedin.com/in/correctUser');
    // await settingsProfilePage.twitterInput.fill('https://twitter.com/correctUser');
    // await settingsProfilePage.updateButton.click();
    
    // // Verify no error messages are displayed
    // await expect(settingsProfilePage.profileIsInvalidMsg).not.toBeVisible();
    
    // // Restore original values
    // await settingsProfilePage.updateProfile({
    //   github: originalGithub,
    //   linkedin: originalLinkedin,
    //   twitter: originalTwitter
    // });
  });

  test('@Negative Error messages should display in the same locale language', async ({ browser }) => {
    // Create a browser context set to Chinese
    const context = await browser.newContext({
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });
    // Create a page using the new context
    const page = await context.newPage();
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9'
    });
    
    // Create page object
    const settingsProfilePage = new SettingsProfilePage(page);
    
    // Navigate to settings page
    await settingsProfilePage.navigateTo();
    
    // Save current name for restoration after test
    const originalName = await settingsProfilePage.getCurrentName();
    
    // Set invalid GitHub link
    await settingsProfilePage.githubInput.fill('github.com/testuser');
    await settingsProfilePage.updateButton.click();
    // Verify invalid link error is displayed
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // Clear Name field
    await settingsProfilePage.nameInput.clear();
    await settingsProfilePage.bioInput.click();
    
    // Verify both error messages are displayed
    await expect(settingsProfilePage.nameInvalidMsg).toBeVisible();
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // Check for inconsistent error message language
    const nameErrorText = await settingsProfilePage.nameInvalidMsg.textContent();
    const profileErrorText = await settingsProfilePage.profileIsInvalidMsg.textContent();
    
    console.log(`Name error message (Chinese): ${nameErrorText}`);
    console.log(`Profile link error message (English): ${profileErrorText}`);
    
    // Restore original name
    await settingsProfilePage.updateProfile({ name: originalName, github: '' });
    
    // Close context
    await context.close();
  });

  test('Username update should be reflected in dashboard', async ({ page, dashboardPage }) => {
    // Generate random name to avoid conflicts
    const newName = `This is_a_TestName_${Date.now()}`;
    
    // Update profile name
    await settingsProfilePage.updateProfile({ name: newName });
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // Navigate to dashboard
    await dashboardPage.navigateToDashboard();
    await expect(dashboardPage.userProfileButton).toBeVisible();
    await expect(dashboardPage.welcomeMessages).toBeVisible();
    
    // Verify user profile button displays new name
    await expect(dashboardPage.userProfileButton).toContainText(newName, { timeout: 10000 });
  });
});
