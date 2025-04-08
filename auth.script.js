const { chromium } = require('playwright');
const path = require('path');

const authFile = path.join(__dirname, 'playwright/.auth/user.json');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 导航到登录页面
  await page.goto('https://app.insomnia.rest/app/authorize');
  
  // 提示用户手动登录
  console.log('请在浏览器中手动登录，完成后按 Enter 键...');
    // login with available options
  console.log('*****************************************************');
  console.log('MANUAL LOGIN REQUIRED:');
  console.log('1. Go to https://app.insomnia.rest/app/authorize login page.');
  console.log('2. Click the one of the available Login options.');
  console.log('3. COMPLETE the login MANUALLY in the browser window.');
  console.log('4. Ensure you are redirected back to your application (https://app.insomnia.rest).');
  console.log('5. Once logged in successfully, press Enter here to save the state.');
  console.log('*****************************************************');
  // press ENTER in terminal after login
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  // 保存认证状态
  await context.storageState({ path: authFile });
  console.log('认证状态已保存到', authFile);
  
  await browser.close();
})(); 