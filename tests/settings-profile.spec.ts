import { time } from 'console';
import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';
import { SettingsProfilePage } from '../pages/settings-profile-page';

// 配置此测试文件使用单个 worker
test.describe.configure({ 
  mode: 'serial',
  retries: 0  // 不重试失败的测试
});

test.describe('设置个人资料页面测试', () => {
  let settingsProfilePage: SettingsProfilePage;

  test.beforeEach(async ({ page }) => {
    settingsProfilePage = new SettingsProfilePage(page);
    await settingsProfilePage.navigateTo();
  });

  test('当名称为空时，点击更新按钮应显示错误信息', async ({ page }) => {
    // 保存当前名称以便测试后恢复
    const originalName = await settingsProfilePage.getCurrentName();
    
    // 清空名称字段
    await settingsProfilePage.nameInput.clear();
    
    // 点击更新按钮
    await settingsProfilePage.updateButton.click();
    
    // 验证错误信息显示
    await expect(settingsProfilePage.nameCannotEmptyMsg).toBeVisible();
    
    // 恢复原始名称
    await settingsProfilePage.updateProfile({ name: originalName });
  });

  test('更新用户名应在仪表盘中反映更改', async ({ page, dashboardPage }) => {
    // 生成随机名称以避免冲突
    const newName = `This is_a_TestName_${Date.now()}`;
    
    // 更新个人资料名称
    await settingsProfilePage.updateProfile({ name: newName });
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // 导航到仪表盘
    await dashboardPage.navigateToDashboard();
    
    // 验证用户资料按钮显示新名称
    await expect(dashboardPage.userProfileButton).toContainText(newName);
  });

  test('更新 GitHub 资料应成功保存', async ({ page }) => {
    // 生成随机 GitHub 用户名
    const githubUsername = `github-user-${Date.now()}`;
    const githubUrl = `https://github.com/${githubUsername}`;
    
    // 更新 GitHub 资料
    await settingsProfilePage.updateProfile({ github: githubUrl });
    
    // 等待更新成功消息
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // 刷新页面以验证更改已保存
    await page.reload();
    
    // 验证 GitHub 输入框包含新的 URL
    await expect(settingsProfilePage.githubInput).toHaveValue(githubUrl);
  });

  test('@Negative 名称字段可以设置为只包含空格', async ({ page }) => {
    // 保存当前名称以便测试后恢复
    const originalName = await settingsProfilePage.getCurrentName();
    
    // 设置名称为两个空格
    await settingsProfilePage.nameInput.fill('  ');
    await settingsProfilePage.updateButton.click();
    
    // 等待更新完成
    await expect(settingsProfilePage.updateButton).toBeEnabled();
    
    // 刷新页面验证更改已保存
    await page.reload();
    
    // 验证名称字段的值是两个空格
    const currentName = await settingsProfilePage.nameInput.inputValue();
    expect(currentName).toBe('  ');
    console.log(`名称字段被设置为空格: "${currentName}"`);
    
    // 恢复原始名称
    await settingsProfilePage.updateProfile({ name: originalName });
  });

  test('@Negative 社交媒体链接验证不一致', async ({ page }) => {
    // 保存当前值以便测试后恢复
    const originalGithub = await settingsProfilePage.githubInput.inputValue();
    const originalLinkedin = await settingsProfilePage.linkedinInput.inputValue();
    const originalTwitter = await settingsProfilePage.twitterInput.inputValue();
    
    // 设置不带https://前缀的链接
    await settingsProfilePage.githubInput.fill('github.com/mustStartWithHttp');
    await settingsProfilePage.linkedinInput.fill('linkedin.com/in/mustStartWithHttp');
    await settingsProfilePage.twitterInput.fill('twitter.com/mustStartWithHttp');
    
    // 点击更新按钮
    await settingsProfilePage.updateButton.click();
    
    // 验证Twitter显示了错误信息
    await expect(settingsProfilePage.twitterProfileInvalidMsg).toBeVisible();
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // 检查GitHub和LinkedIn是否也应该显示错误信息
    const isGithubErrorVisible = await settingsProfilePage.githubProfileInvalidMsg.isVisible();
    const isLinkedinErrorVisible = await settingsProfilePage.linkedinProfileInvalidMsg.isVisible();
    
    console.log(`GitHub错误信息显示: ${isGithubErrorVisible}`);
    console.log(`LinkedIn错误信息显示: ${isLinkedinErrorVisible}`);
    console.log('问题: 如果所有社交媒体链接都需要以https://开头，验证应该一致');
    
    // // 测试正确格式的链接
    // await settingsProfilePage.githubInput.fill('https://github.com/correctUser');
    // await settingsProfilePage.linkedinInput.fill('https://linkedin.com/in/correctUser');
    // await settingsProfilePage.twitterInput.fill('https://twitter.com/correctUser');
    // await settingsProfilePage.updateButton.click();
    
    // // 验证没有错误信息显示
    // await expect(settingsProfilePage.profileIsInvalidMsg).not.toBeVisible();
    
    // // 恢复原始值
    // await settingsProfilePage.updateProfile({
    //   github: originalGithub,
    //   linkedin: originalLinkedin,
    //   twitter: originalTwitter
    // });
  });

  test('@Negative 错误信息应显示相同时区语言', async ({ browser }) => {
    // 创建一个设置为中文的浏览器上下文
    const context = await browser.newContext({
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });
    // 使用新上下文创建页面
    const page = await context.newPage();
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9'
    });
    
    // 创建页面对象
    const settingsProfilePage = new SettingsProfilePage(page);
    
    // 导航到设置页面
    await settingsProfilePage.navigateTo();
    
    // 保存当前名称以便测试后恢复
    const originalName = await settingsProfilePage.getCurrentName();
    
    // 设置无效的GitHub链接
    await settingsProfilePage.githubInput.fill('github.com/testuser');
    await settingsProfilePage.updateButton.click();
    // 验证显示无效链接错误
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // 清空Name字段
    await settingsProfilePage.nameInput.clear();
    await settingsProfilePage.bioInput.click();
    
    // 验证同时显示两个错误信息
    await expect(settingsProfilePage.nameInvalidMsg).toBeVisible();
    await expect(settingsProfilePage.profileIsInvalidMsg).toBeVisible();
    
    // 检查错误信息语言不一致的问题
    const nameErrorText = await settingsProfilePage.nameInvalidMsg.textContent();
    const profileErrorText = await settingsProfilePage.profileIsInvalidMsg.textContent();
    
    console.log(`名称错误信息(中文): ${nameErrorText}`);
    console.log(`资料链接错误信息(英文): ${profileErrorText}`);
    
    // 恢复原始名称
    await settingsProfilePage.updateProfile({ name: originalName, github: '' });
    
    // 关闭上下文
    await context.close();
  });
});
