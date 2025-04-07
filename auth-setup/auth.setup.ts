import { test as setup, expect } from '@playwright/test';
// import { LoginPage } from '../pages/login-page';

// 为整个测试设置超时时间（例如 5 分钟 = 300000 毫秒）
setup('登录并保存认证状态', async ({ page }) => {
  // 设置此测试的超时时间为 5 分钟
  setup.setTimeout(300000);
  
  // const loginPage = new LoginPage(page);
//   await loginPage.navigateToLoginPage();
  
//   // 点击 Google 登录按钮
//   await loginPage.clickElement(loginPage.googleLoginButton);
  
  //go to google login page
  await page.goto('https://app.insomnia.rest/app/authorize')
  // 检查是否已重定向到 Google 登录页面

  console.log('请在浏览器中手动登录，完成后按 Enter 键...请在5分钟之内完成');
    // login with available options
  console.log('*****************************************************');
  console.log('MANUAL LOGIN REQUIRED:');
  console.log('1. Go to your application\'s login page.');
  console.log('2. Click the one of the available Login options.');
  console.log('3. COMPLETE the login MANUALLY in the browser window.');
  console.log('4. Ensure you are redirected back to your application (app.insomnia.rest).');
  console.log('5. Once logged in successfully, press Enter here to save the state.');
  console.log('*****************************************************');
  // press ENTER in terminal after login
  console.log('请在登录后按下 ENTER 键继续...');
  // await new Promise(resolve => process.stdin.once('data', resolve));
  // 继续执行后续测试步骤
  
  // 检查是否已成功登录并重定向回 Insomnia，使用更长的超时
  await expect(page).toHaveURL('https://app.insomnia.rest/app/dashboard/organizations', { timeout: 300000 });
  
  // 保存认证状态
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  console.log('认证状态已保存到 auth.json');
}); 