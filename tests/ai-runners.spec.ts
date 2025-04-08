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

  test('@Negative LLM provider name misspelled', async ({ aiRunnersPage, page }) => {
    // Click on LLM provider selection button
    await aiRunnersPage.runnerLLMProvider.click();
    
    // Find "Open AI" option in dropdown menu
    const openAIOption = page.getByRole('option', { name: /Open AI/i });
    
    // Verify option exists and click
    await expect(openAIOption).toBeVisible();
    
    // Get actual text of the option
    const optionText = await openAIOption.textContent();
    
    // Log actual text for verification
    console.log(`LLM provider option text: "${optionText}"`);
    
    // Verify if text has spelling error (should be "OpenAI" not "Open AI")
    if (optionText && optionText.includes('Open AI')) {
      console.log('Error: Provider name should be "OpenAI", not "Open AI"');
    }
    
    // // Click the option
    // await openAIOption.click();
    // // Verify text displayed on button after selection
    // const selectedText = await aiRunnersPage.runnerLLMProvider.textContent();
    // console.log(`Button text after selection: "${selectedText}"`);
    
    // // Check if selected text also has the same spelling issue
    // expect(selectedText).toContain('Open AI');
    // console.log('Issue: Company name "OpenAI" is incorrectly displayed as "Open AI" in the interface');
  });

  // More AI Runners tests...
}); 