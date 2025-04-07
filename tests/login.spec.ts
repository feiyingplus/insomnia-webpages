import { test, expect } from '../fixtures/pages.fixture';

test.describe('Login Page Tests', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateToLoginPage();
  });

  test('should display all login options', async ({ loginPage }) => {
    await expect(loginPage.googleLoginButton).toBeVisible();
    await expect(loginPage.githubLoginButton).toBeVisible();
    await expect(loginPage.emailLoginButton).toBeVisible();
    await expect(loginPage.enterpriseSSOLoginButton).toBeVisible();
  });

  test('should have terms of service and privacy policy links', async ({ loginPage }) => {
    await expect(loginPage.termsOfServiceLink).toBeVisible();
    await expect(loginPage.privacyPolicyLink).toBeVisible();
  });

  // 更多登录测试...
}); 