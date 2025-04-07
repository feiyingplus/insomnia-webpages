import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly googleLoginButton: Locator;
  readonly githubLoginButton: Locator;
  readonly emailLoginButton: Locator;
  readonly enterpriseSSOLoginButton: Locator;
  readonly termsOfServiceLink: Locator;
  readonly privacyPolicyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.googleLoginButton = page.getByRole('button', { name: 'Continue with Google' });
    this.githubLoginButton = page.getByRole('button', { name: 'Continue with GitHub' });
    this.emailLoginButton = page.getByRole('button', { name: 'Continue with Email' });
    this.enterpriseSSOLoginButton = page.getByRole('button', { name: 'Continue with Enterprise SSO' });
    this.termsOfServiceLink = page.getByRole('link', { name: 'Terms of Service' });
    this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy Policy' });
  }

  async navigateToLoginPage() {
    await this.navigateTo('/app/authorize');
    await this.waitForPageLoad();
  }

  async loginWithGoogle() {
    await this.clickElement(this.googleLoginButton);
    // 处理 Google 登录流程
  }

  async loginWithGithub() {
    await this.clickElement(this.githubLoginButton);
    // 处理 GitHub 登录流程
  }

  async loginWithEmail(email: string, password: string) {
    await this.clickElement(this.emailLoginButton);
    // 填写邮箱和密码的逻辑
  }

  async loginWithEnterpriseSSO() {
    await this.clickElement(this.enterpriseSSOLoginButton);
    // 处理企业 SSO 登录流程
  }
} 