import { test as base, expect as baseExpect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { AIRunnersPage } from '../pages/ai-runners-page';
import { SettingsProfilePage } from '../pages/settings-profile-page';
import { request } from '@playwright/test';
import path from 'path';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  aiRunnersPage: AIRunnersPage;
  settingsPrifllePage:SettingsProfilePage;
};

// 扩展基本测试 fixture
export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  aiRunnersPage: async ({ page }, use) => {
    await use(new AIRunnersPage(page));
  },
  settingsPrifllePage: async ({ page }, use) => {
    await use(new SettingsProfilePage(page));
  }
});

// 创建一个已认证的测试fixture
export const authenticatedTest = test.extend({
  // 使用预先保存的认证状态
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(process.cwd(), 'playwright/.auth/user.json')
    });
    await use(context);
    await context.close();
  }
});

// 确保导出的 test 和 expect 与标准 Playwright 格式一致
export { expect } from '@playwright/test'; 