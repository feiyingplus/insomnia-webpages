import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class SettingsProfilePage extends BasePage {
  readonly nameInput: Locator;
  readonly bioInput: Locator;
  readonly githubInput: Locator;
  readonly linkedinInput: Locator;
  readonly twitterInput: Locator;
  readonly updateButton: Locator;
  
  // 错误消息 Locator
  readonly nameCannotEmptyMsg: Locator;
  readonly profileIsInvalidMsg: Locator;

  readonly nameInvalidMsg: Locator;
  readonly githubProfileInvalidMsg: Locator;
  readonly linkedinProfileInvalidMsg: Locator;
  readonly twitterProfileInvalidMsg: Locator;
  
  // 导航链接
  readonly profileNavLink: Locator;
  readonly accountNavLink: Locator;
  readonly billingNavLink: Locator;
  readonly encryptionNavLink: Locator;
  readonly notificationsNavLink: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.bioInput = page.getByRole('textbox', { name: 'Bio' });
    this.githubInput = page.getByRole('textbox', { name: 'Github profile' });
    this.linkedinInput = page.getByRole('textbox', { name: 'Linkedin profile' });
    this.twitterInput = page.getByRole('textbox', { name: 'Twitter profile' });
    this.updateButton = page.getByRole('button', { name: 'Update' });

    // 顶部错误消息
    this.nameCannotEmptyMsg = page.getByText('The name cannot be an empty');
    this.profileIsInvalidMsg = page.getByText('The profile url is invalid.');
    
    // 字段级错误消息 - 支持中英文两种版本
    this.nameInvalidMsg = page.getByText(/Please fill out this field\.|请填写此字段。/);
    this.githubProfileInvalidMsg = page.getByText('Please enter a valid Github profile link');
    this.linkedinProfileInvalidMsg = page.getByText('Please enter a valid Linkedin profile link');
    this.twitterProfileInvalidMsg = page.getByText('Please enter a valid Twitter profile link');

    // 导航链接
    this.profileNavLink = page.getByRole('link', { name: 'Profile' });
    this.accountNavLink = page.getByRole('link', { name: 'Account' });
    this.billingNavLink = page.getByRole('link', { name: 'Billing' });
    this.encryptionNavLink = page.getByRole('link', { name: 'Encryption' });
    this.notificationsNavLink = page.getByRole('link', { name: 'Notifications' });
  }

  async navigateTo() {
    await this.page.goto('/app/settings/profile');
  }

  async updateProfile(profileData: {
    name?: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
  }) {
    if (profileData.name) await this.nameInput.fill(profileData.name);
    if (profileData.bio) await this.bioInput.fill(profileData.bio);
    if (profileData.github) await this.githubInput.fill(profileData.github);
    if (profileData.linkedin) await this.linkedinInput.fill(profileData.linkedin);
    if (profileData.twitter) await this.twitterInput.fill(profileData.twitter);
    await this.updateButton.click();
  }

  async getCurrentName(): Promise<string> {
    return this.nameInput.inputValue();
  }
}
