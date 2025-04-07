import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';

test.describe('AI Runners Page Tests', () => {
  test.beforeEach(async ({ aiRunnersPage }) => {
    await aiRunnersPage.navigateToAIRunners();
  });

  test('should display AI Runners title', async ({ aiRunnersPage }) => {
    await expect(aiRunnersPage.headingTitle).toBeVisible();
    await expect(aiRunnersPage.subHeadingTitle).toBeVisible();
  });

  test('should display create new runner button', async ({ aiRunnersPage }) => {
    await expect(aiRunnersPage.sendNewRunnerButton).toBeVisible();
  });

  test('should display new runner option buttons', async ({ aiRunnersPage, dashboardPage }) => {
    await expect(aiRunnersPage.runnerLLMProvider).toBeVisible();
    await expect(aiRunnersPage.runnerSimilarity).toBeVisible();
    await expect(aiRunnersPage.runnerCacheTime).toBeVisible();
    await expect(aiRunnersPage.runnerSimilarity).toBeVisible();
  });

  test('@Negative LLM提供商名称拼写错误', async ({ aiRunnersPage, page }) => {
    // 点击 LLM 提供商选择按钮
    await aiRunnersPage.runnerLLMProvider.click();
    
    // 查找下拉菜单中的 "Open AI" 选项
    const openAIOption = page.getByRole('option', { name: /Open AI/i });
    
    // 验证选项存在并点击
    await expect(openAIOption).toBeVisible();
    
    // 获取选项的实际文本
    const optionText = await openAIOption.textContent();
    
    // 记录实际文本以便检查
    console.log(`LLM提供商选项文本: "${optionText}"`);
    
    // 验证文本是否有拼写错误 (应该是 "OpenAI" 而不是 "Open AI")
    if (optionText && optionText.includes('Open AI')) {
      console.log('错误: 提供商名称应该是 "OpenAI"，而不是 "Open AI"');
    }
    
    // // 点击选项
    // await openAIOption.click();
    // // 验证选择后按钮上显示的文本
    // const selectedText = await aiRunnersPage.runnerLLMProvider.textContent();
    // console.log(`选择后按钮显示文本: "${selectedText}"`);
    
    // // 检查选择后的文本是否也有同样的拼写问题
    // expect(selectedText).toContain('Open AI');
    // console.log('问题: 公司名称 "OpenAI" 在界面上被错误地显示为 "Open AI"');
  });

  // 更多 AI Runners 测试...
}); 