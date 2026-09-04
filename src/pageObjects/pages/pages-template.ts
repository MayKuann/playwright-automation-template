import { Locator, Page } from '@playwright/test';
import { BasePageObject } from '../../core/BasePageObject';

/**
 * Copy this file, rename the class, and replace these example locators with
 * locators that describe your application's page.
 */
export class PageTemplate extends BasePageObject {
  readonly heading: Locator;
  readonly primaryAction: Locator;

  constructor(page: Page, url: string) {
    super(page, url);
    this.heading = page.getByRole('heading').first();
    this.primaryAction = page.getByRole('button', { name: /save|submit|continue/i });
  }

  async expectLoaded(): Promise<void> {
    await this.assertVisible(this.heading, { description: 'page heading' });
  }

  async submit(): Promise<void> {
    await this.clickWhenReady(this.primaryAction, { description: 'primary action' });
  }
}
