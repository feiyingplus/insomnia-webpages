import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class AIRunnersPage extends BasePage {
  readonly headingTitle: Locator;
  readonly subHeadingTitle: Locator;
  readonly runnersList: Locator;

  // AI Runners create
  readonly sendNewRunnerButton: Locator;
  readonly runnerLLMProvider: Locator;
  readonly runnerSimilarity: Locator;
  readonly runnerCacheTime: Locator;
  readonly runnerGuardrails: Locator;

  // AI Runners list
  readonly runnerUrlButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.headingTitle = page.getByRole('heading', { name: 'Accelerate your AI' });
    this.subHeadingTitle = page.getByText('Semantically cache and secure');
    this.runnersList = page.locator('[data-testid="runners-list"]');
    this.sendNewRunnerButton = page.getByRole('button', { name: 'Send' });
    
    // 使用正则表达式匹配四个可能的提供商名称
    this.runnerLLMProvider = page.getByRole('button', { 
      name: /(Open AI|Anthropic|Mistral|Cohere)/
    });
    
    this.runnerSimilarity = page.getByRole('button', { 
      name: /(No cache|Loose Similarity|Medium Similarity|Strong Similarity)/
    });

    this.runnerCacheTime = page.getByRole('button', { 
      name: /\d+[smd]\s+Cache\s+TTL/i 
    });

    this.runnerGuardrails = page.getByRole('button', { 
      name: /(No|\d+)\s+guardrail(s)?/i 
    });
    this.runnerUrlButtons = page.getByRole('button', { 
      name: /https:\/\/[a-zA-Z0-9-]+\.insomnia\.rest/
    });
  }

  async navigateToAIRunners() {
    await this.navigateTo('/ai-runners');
    await this.waitForPageLoad();
  }

  async createNewRunner() {
    //  need to add options and press send button
    await this.clickElement(this.sendNewRunnerButton);
  }

  async getRunnersList(): Promise<string[]> {
    const runners = await this.runnersList.locator('.runner-item').all();
    const runnerNames: string[] = [];
    
    for (const runner of runners) {
      const name = await runner.textContent();
      if (name) runnerNames.push(name.trim());
    }
    
    return runnerNames;
  }
  
  /**
   * 点击指定索引的 Runner URL 按钮
   * @param index 按钮索引，默认为 0（第一个按钮）
   */
  async clickRunnerUrlButton(index: number = 0) {
    const buttons = await this.runnerUrlButtons.all();
    if (buttons.length <= index) {
      throw new Error(`没有找到索引为 ${index} 的 Runner URL 按钮，总共只有 ${buttons.length} 个按钮`);
    }
    await buttons[index].click();
  }
  
  /**
   * 获取指定索引的 Runner URL
   * @param index 按钮索引，默认为 0（第一个按钮）
   * @returns Runner URL 或 null（如果未找到）
   */
  async getRunnerUrl(index: number = 0): Promise<string | null> {
    const buttons = await this.runnerUrlButtons.all();
    if (buttons.length <= index) {
      return null;
    }
    
    const buttonText = await buttons[index].textContent();
    const urlMatch = buttonText?.match(/https:\/\/[a-zA-Z0-9-]+\.insomnia\.rest/);
    return urlMatch ? urlMatch[0] : null;
  }
  
  /**
   * 获取 Runner URL 按钮的总数
   * @returns 按钮数量
   */
  async getRunnerUrlButtonCount(): Promise<number> {
    const buttons = await this.runnerUrlButtons.all();
    return buttons.length;
  }
} 