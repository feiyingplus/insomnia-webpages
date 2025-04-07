import { authenticatedTest as test, expect } from '../fixtures/pages.fixture';
import { SettingsProfilePage } from '../pages/settings-profile-page';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('设置个人资料页面无障碍性测试', () => {
  let settingsProfilePage: SettingsProfilePage;

  test.beforeEach(async ({ page }) => {
    settingsProfilePage = new SettingsProfilePage(page);
    await settingsProfilePage.navigateTo();
  });

  test('@Negative - 个人资料页面应符合 WCAG 2.1 AA 标准', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 运行无障碍性检查
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // 输出违规数量以便调试
    console.log(`检测到 ${accessibilityScanResults.violations.length} 个无障碍性问题`);
    
    // 如果有违规，输出详细信息
    if (accessibilityScanResults.violations.length > 0) {
      for (const violation of accessibilityScanResults.violations) {
        console.log(`\n问题: ${violation.description}`);
        console.log(`影响: ${violation.impact}`);
        console.log(`WCAG: ${violation.tags.filter(tag => tag.startsWith('wcag')).join(', ')}`);
        console.log(`受影响的元素: ${violation.nodes.length}`);
        
        // 输出前3个受影响元素的详细信息
        violation.nodes.slice(0, 3).forEach((node, i) => {
          console.log(`\n元素 ${i+1}:`);
          console.log(`HTML: ${node.html}`);
          console.log(`定位器: ${node.target}`);
          console.log(`修复建议: ${node.failureSummary}`);
        });
      }
    }
    
    // 验证没有严重或关键的无障碍性问题
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    
    expect(criticalViolations.length, 
      `发现 ${criticalViolations.length} 个严重的无障碍性问题`).toBe(0);
    
    // 记录警告级别的问题，但不导致测试失败
    const warningViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'moderate' || v.impact === 'minor'
    );
    
    if (warningViolations.length > 0) {
      console.log(`\n警告: 发现 ${warningViolations.length} 个中低等级的无障碍性问题`);
    }
  });

  test('个人资料表单元素应具有正确的标签和描述', async ({ page }) => {
    // 检查表单字段是否有适当的标签
    const formFields = [
      { name: 'Name', selector: 'input[name="name"]' },
      { name: 'Bio', selector: 'textarea[name="bio"]' },
      { name: 'Github profile', selector: 'input[name="github"]' },
      { name: 'Linkedin profile', selector: 'input[name="linkedin"]' },
      { name: 'Twitter profile', selector: 'input[name="twitter"]' }
    ];
    
    for (const field of formFields) {
      // 检查字段是否存在
      const fieldElement = page.locator(field.selector);
      await expect(fieldElement).toBeVisible();
      
      // 检查字段是否有标签
      const hasLabel = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        
        // 检查aria-label属性
        if (el.getAttribute('aria-label')) return true;
        
        // 检查是否有关联的label元素
        const id = el.id;
        if (id && document.querySelector(`label[for="${id}"]`)) return true;
        
        // 检查父元素是否为label
        return el.closest('label') !== null;
      }, field.selector);
      
      expect(hasLabel, `${field.name} 字段缺少可访问的标签`).toBeTruthy();
    }
    
    // 检查提交按钮是否可访问
    const updateButton = page.getByRole('button', { name: 'Update' });
    await expect(updateButton).toBeVisible();
    
    // 检查按钮是否有可访问的名称
    const buttonName = await updateButton.getAttribute('aria-label') || 
                       await updateButton.textContent();
    expect(buttonName, '更新按钮缺少可访问的名称').toBeTruthy();
  });

  test('个人资料页面应支持键盘导航', async ({ page }) => {
    // 将焦点设置到页面
    await page.focus('body');
    
    // 定义元素类型
    interface TabbableElement {
      tag: string;
      type: string | null;
      name: string | null;
      text: string | undefined;
    }

    // 模拟用户使用Tab键浏览页面
    const tabbableElements: Array<{
      tag: string;
      type: string | null;
      name: string | null;
      text: string | undefined;
    }> = [];
    
    // 按Tab键直到循环回到开始或达到最大次数
    const maxTabs = 20; // 防止无限循环
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      
      // 获取当前焦点元素
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? {
          tag: el.tagName,
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          text: el.textContent?.trim().substring(0, 50)
        } : null;
      });
      
      if (focusedElement) {
        tabbableElements.push(focusedElement);
      }
    }
    
    // 验证可以通过键盘访问所有重要元素
    console.log('可通过Tab键访问的元素:', tabbableElements);
    
    // 检查是否可以访问所有表单字段
    const formFieldNames = ['name', 'bio', 'github', 'linkedin', 'twitter'];
    const accessibleFields = formFieldNames.filter(name => 
      tabbableElements.some(el => el.name === name)
    );
    
    expect(accessibleFields.length, `只有 ${accessibleFields.length}/${formFieldNames.length} 个表单字段可通过键盘访问`).toBe(formFieldNames.length);
    
    // 检查是否可以访问提交按钮
    const canAccessSubmitButton = tabbableElements.some(el => 
      (el.tag === 'BUTTON' && el.text?.includes('Update')) ||
      (el.tag === 'INPUT' && el.type === 'submit')
    );
    
    expect(canAccessSubmitButton, '无法通过键盘访问提交按钮').toBeTruthy();
  });
}); 