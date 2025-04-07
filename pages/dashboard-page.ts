import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  // 顶部导航栏元素
  readonly dashboardLink: Locator;
  readonly aiRunnersLink: Locator;
  readonly headerLogo: Locator;
  readonly userProfileButton: Locator;
  readonly upgradeLink: Locator;
  
  // Dashboard Message and Download links
  readonly welcomeMessages: Locator;
  readonly downloadForMacOSButton: Locator;
  readonly downloadForWindowsLink: Locator;
  readonly downloadForLinuxLink: Locator;
  readonly seeAllDownloadsLink: Locator;
  
  // 组织列表
  readonly organizationsSection: Locator;
  readonly organizationsListItems: Locator;
  readonly openButtons: Locator;
  readonly newOrganizationButton: Locator;
  readonly filterInput: Locator;
  
  // footer locators
  readonly footerInsomniaLogo: Locator;
  readonly footerKongInc: Locator;
  readonly footerSupportLink: Locator;
  readonly footerSlackLink: Locator;
  readonly footerGitHubLink: Locator;
  readonly footerTwitterLink: Locator;
  readonly footerBlogLink: Locator;
  readonly footerTermsLink: Locator;
  readonly footerPrivacyLink: Locator;

  constructor(page: Page) {
    super(page);
    // 顶部导航栏
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.aiRunnersLink = page.getByRole('link', { name: 'AI Runners' });
    this.headerLogo = page.locator('/html/body/div/div/div/div[1]/div');
    this.userProfileButton = page.getByRole('button', { name: 'User Menu'});
    this.upgradeLink = page.getByRole('link', { name: 'Upgrade' });
    
    // Dashboard Message and Download links
    this.welcomeMessages = page.getByText(/Get started with Insomnia, .+!/);
    this.downloadForMacOSButton = page.getByRole('link', { name: 'MacOS' });
    this.downloadForWindowsLink = page.getByRole('link', { name: 'Windows' });
    this.downloadForLinuxLink = page.getByRole('link', { name: 'Linux' });
    this.seeAllDownloadsLink = page.getByRole('link', { name: 'see all downloads' });
    
    // 组织列表
    this.organizationsSection = page.getByText('Organizations you own (2)');
    this.organizationsListItems = page.getByRole('listbox',{} );
    this.openButtons = page.getByRole('button', { name: 'Open' });
    this.newOrganizationButton = page.getByRole('link', { name: 'New organization' });
    this.filterInput = page.getByPlaceholder('Filter...');
  
    // footer locators
    this.footerInsomniaLogo = page.getByRole('contentinfo').locator('path').first();
    this.footerKongInc = page.getByRole('link', { name: 'Kong Inc.' });
    this.footerSupportLink = page.getByRole('link', { name: 'Support' });
    this.footerSlackLink = page.getByRole('link', { name: 'Slack' });
    this.footerGitHubLink = page.getByRole('link', { name: 'Github' });
    this.footerTwitterLink = page.getByRole('link', { name: 'Twitter' });
    this.footerBlogLink = page.getByRole('link', { name: 'Blog' });
    this.footerTermsLink = page.getByRole('link', { name: 'Terms', exact: true });
    this.footerPrivacyLink = page.getByRole('link', { name: 'Privacy', exact: true });
  }

  async navigateToDashboard() {
    await this.navigateTo('/app/dashboard/organizations');
    await this.waitForPageLoad();
  }

  async openUserProfile() {
    await this.clickElement(this.userProfileButton);
  }


  async navigateToAIRunners() {
    await this.clickElement(this.aiRunnersLink);
  }
  
  // download by plaform
  async downloadDesktopApp(platform: 'MacOS' | 'Windows' | 'Linux' = 'MacOS') {
    switch (platform) {
      case 'MacOS':
        await this.clickElement(this.downloadForMacOSButton);
        break;
      case 'Windows':
        await this.clickElement(this.downloadForWindowsLink);
        break;
      case 'Linux':
        await this.clickElement(this.downloadForLinuxLink);
        break;
    }
  }
  
  async createNewOrganization() {
    await this.clickElement(this.newOrganizationButton);
  }
  
  async filterOrganizations(filterText: string) {
    await this.filterInput.fill(filterText);
  }
  
  async openPersonalWorkspace(index: number = 0) {
    const openButtons = await this.openButtons.all();
    if (openButtons.length > index) {
      await openButtons[index].click();
    }
  }
  
  async expectDashboardLoaded() {
    await this.page.waitForLoadState('networkidle');
    await this.organizationsSection.waitFor({ state: 'visible' });
    await this.organizationsListItems.waitFor({ state: 'visible' });
  }
} 