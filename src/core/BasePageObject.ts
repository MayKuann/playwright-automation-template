import { Page, Locator, expect } from '@playwright/test';
import { logger } from './utils/logger';
import { RetryHelper } from './utils/retryHelper';

/**
 * Configuration for timeout values used across the application
 */
export const TimeoutConfig = {
  // Default timeout values in milliseconds
  SHORT: 5000,       // 5 seconds
  MEDIUM: 15000,     // 15 seconds
  LONG: 30000,       // 30 seconds
  NAVIGATION: 60000, // 1 minute
  // Custom timeout value getter with fallback
  get: (name: 'short' | 'medium' | 'long' | 'navigation', defaultValue?: number): number => {
    switch (name) {
      case 'short': return TimeoutConfig.SHORT;
      case 'medium': return TimeoutConfig.MEDIUM;
      case 'long': return TimeoutConfig.LONG;
      case 'navigation': return TimeoutConfig.NAVIGATION;
      default: return defaultValue || TimeoutConfig.MEDIUM;
    }
  }
};

/**
 * Base page object class that provides common functionality for all page objects
 */
export class BasePageObject {
  readonly page: Page;
  readonly url: string;

  /**
   * Creates a new BasePageObject instance
   * @param page Playwright page object
   * @param url The URL of the page (optional)
   */
  constructor(page: Page, url?: string) {
    this.page = page;
    this.url = url || '';
  }

  /**
   * Navigates to the page
   * @param options Navigation options
   * @returns Promise that resolves when navigation is complete
   */
  async navigate(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<string> {
    const timeout = options?.timeout || TimeoutConfig.NAVIGATION;
    logger.info(`Navigating to ${this.url} with timeout ${timeout}ms`);

    try {
      const start = performance.now(); // Start timer

      await RetryHelper.retry(
        async () => {
          await this.page.goto(this.url, {
            waitUntil: options?.waitUntil || 'domcontentloaded',
            timeout
          });
          
        },
        2, // max retries
        1000, // retry interval
        `navigate to ${this.url}`
      );

      const end = performance.now(); // End timer
      const loadTime = (end - start).toFixed(2);
      const comments = `Page load (until ${options?.waitUntil || 'domcontentloaded'}) took ${loadTime} ms`;
      logger.info(comments);

      return comments;
    } catch (error) {
      logger.error(`Failed to navigate to ${this.url}: ${error}`);
      // Take screenshot on navigation failure
      await this.takeScreenshot(`navigation_failure_${Date.now()}`);
      throw new Error(`Navigation to ${this.url} failed: ${error}`);
    }
  }

  /**
   * Waits for the page to load completely
   * @param timeout Timeout in milliseconds
   */
  async waitForPageLoad(timeout: number = TimeoutConfig.MEDIUM): Promise<void> {
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout });
      await this.page.waitForLoadState('networkidle', { timeout });
      logger.info('Page loaded completely');
    } catch (error) {
      logger.warn(`Page load wait timed out after ${timeout}ms: ${error}`);
      // We don't throw here as sometimes pages never reach networkidle state due to continuous polling
    }
  }

  /**
   * Gets a locator with automatic logging and improved error messages
   * @param selector CSS or XPath selector
   * @param description Human-readable description of the element
   * @returns Playwright Locator object
   */
  getLocator(selector: string, description: string): Locator {
    const locator = this.page.locator(selector);
    logger.debug(`Created locator for "${description}" with selector: ${selector}`);
    return locator;
  }

  /**
   * Waits for an element to be visible and then clicks it
   * @param locator Element locator
   * @param options Click options
   * @returns Promise that resolves when the click is complete
   */
  async clickWhenReady(
    locator: Locator,
    options?: { timeout?: number; force?: boolean; description?: string; retry?: boolean }
  ): Promise<void> {
    const description = options?.description || 'element';
    const timeout = options?.timeout || TimeoutConfig.MEDIUM;
    const shouldRetry = options?.retry !== false; // Default to retry if not explicitly disabled

    try {
      if (shouldRetry) {
        await RetryHelper.retry(
          async () => {
            logger.debug(`Waiting for ${description} to be visible`);
            await locator.waitFor({ state: 'visible', timeout });
            logger.debug(`Clicking on ${description}`);
            await locator.click({ force: options?.force, timeout });
          },
          2, // max retries
          1000, // retry interval
          `click on ${description}`
        );
      } else {
        logger.debug(`Waiting for ${description} to be visible`);
        await locator.waitFor({ state: 'visible', timeout });
        logger.debug(`Clicking on ${description}`);
        await locator.click({ force: options?.force, timeout });
      }
    } catch (error) {
      logger.error(`Failed to click ${description}: ${error}`);
      await this.takeScreenshot(`click_failure_${description.replace(/\s+/g, '_')}`);
      throw new Error(`Failed to click on ${description}: ${error}`);
    }
  }

  /**
   * Fills a form field with text, with automatic waiting and logging
   * @param locator Element locator
   * @param text Text to enter
   * @param options Fill options
   * @returns Promise that resolves when the text has been entered
   */
  async fillWhenReady(
    locator: Locator,
    text: string,
    options?: { timeout?: number; description?: string; retry?: boolean }
  ): Promise<void> {
    const description = options?.description || 'input field';
    const timeout = options?.timeout || TimeoutConfig.MEDIUM;
    const shouldRetry = options?.retry !== false; // Default to retry if not explicitly disabled

    try {
      if (shouldRetry) {
        await RetryHelper.retry(
          async () => {
            logger.debug(`Waiting for ${description} to be visible`);
            await locator.waitFor({ state: 'visible', timeout });
            logger.debug(`Filling ${description} with text (length: ${text.length})`);
            await locator.fill(text);
          },
          2, // max retries
          1000, // retry interval
          `fill ${description}`
        );
      } else {
        logger.debug(`Waiting for ${description} to be visible`);
        await locator.waitFor({ state: 'visible', timeout });
        logger.debug(`Filling ${description} with text (length: ${text.length})`);
        await locator.fill(text);
      }
    } catch (error) {
      logger.error(`Failed to fill ${description}: ${error}`);
      await this.takeScreenshot(`fill_failure_${description.replace(/\s+/g, '_')}`);
      throw new Error(`Failed to fill ${description}: ${error}`);
    }
  }

  /**
   * Checks if an element is visible on the page
   * @param locator Element locator
   * @param options Visibility check options
   * @returns Promise that resolves to true if element is visible, false otherwise
   */
  async isVisible(
    locator: Locator,
    options?: { timeout?: number; description?: string }
  ): Promise<boolean> {
    const description = options?.description || 'element';
    const timeout = options?.timeout || TimeoutConfig.SHORT;

    try {
      await locator.waitFor({ state: 'visible', timeout });
      logger.debug(`${description} is visible`);
      return true;
    } catch (error) {
      logger.debug(`${description} is not visible`);
      return false;
    }
  }

  /**
   * Assert that an element is visible, with detailed error reporting
   * @param locator Element locator
   * @param options Options for the assertion
   */
  async assertVisible(
    locator: Locator,
    options?: { timeout?: number; description?: string }
  ): Promise<void> {
    const description = options?.description || 'element';
    const timeout = options?.timeout || TimeoutConfig.MEDIUM;
    try {
      await expect(locator).toBeVisible({ timeout });
      logger.info(`Successfully verified ${description} is visible`);
    } catch (error) {
      logger.error(`Failed assertion: ${description} should be visible`);
      await this.takeScreenshot(`assertion_failure_${description.replace(/\s+/g, '_')}`);
      throw error;
    }
  }

  /**
   * Assert that text content matches expected value
   * @param locator Element locator
   * @param expectedText Expected text content
   * @param options Options for the assertion
   */
  async assertText(
    locator: Locator,
    expectedText: string,
    options?: { timeout?: number; description?: string }
  ): Promise<void> {
    const description = options?.description || 'element';
    const timeout = options?.timeout || TimeoutConfig.MEDIUM;

    try {
      await expect(locator).toHaveText(expectedText, { timeout });
      logger.info(`Successfully verified ${description} has text "${expectedText}"`);
    } catch (error) {
      const actualText = await locator.textContent();
      logger.error(`Text assertion failed for ${description}. Expected: "${expectedText}", Actual: "${actualText}"`);
      await this.takeScreenshot(`text_assertion_failure_${description.replace(/\s+/g, '_')}`);
      throw error;
    }
  }

  /**
   * Takes a screenshot of the page with optional element highlighting
   * @param name Screenshot name
   * @param highlightLocator Optional locator to highlight
   */
  async takeScreenshot(name: string, highlightLocator?: Locator): Promise<void> {
    try {
      if (highlightLocator) {
        // Add a red border to the element for visibility
        await highlightLocator.evaluate((element) => {
          (element as HTMLElement).style.outline = '3px solid red';
        });
      }

      const screenshotPath = `./screenshots/${name}_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      logger.info(`Screenshot taken: ${screenshotPath}`);
    } catch (error) {
      logger.error(`Failed to take screenshot: ${error}`);
    }
  }

  /**
   * Checks the visibility of multiple elements and logs their status
   * @param elements Array of objects containing locators, names, and required status
   */
  async checkElementVisibility(elements: Array<{ locator: Locator; name: string; required: boolean }>): Promise<void> {
    const visibilityStatus: Record<string, boolean> = {};
    let requiredElementsMissing = false;
    const timeout = 30000;

    for (const element of elements) {
      try {
        await element.locator.waitFor({ state: 'visible', timeout });
        visibilityStatus[element.name] = true;
        logger.info(`Element "${element.name}" is visible`);
      } catch (error) {
        visibilityStatus[element.name] = false;
        if (element.required) {
          requiredElementsMissing = true;
          logger.error(`Required element "${element.name}" is not visible: ${error}`);
        } else {
          logger.info(`Optional element "${element.name}" is not visible, but continuing test`);
        }
      }
    }

    if (requiredElementsMissing) {
      throw new Error(`One or more required main page elements are not visible: ${JSON.stringify(visibilityStatus)}`);
    }
  }

  /**
   * Validates the API response against expected status and body
   * @param response API response object
   * @param expectedStatus Expected HTTP status code
   * @param expectedBody Expected response body
   * @param options Optional validation options
   */
  async validateApiResponses(apiRequests: { url: string; status: number; timeTaken: number }[]) {

    try {
      for (const request of apiRequests) {
        await expect(request.status).toBeGreaterThanOrEqual(200); // Status code should be >= 200
        await expect(request.status).toBeLessThan(300); // Status code should be < 300
        console.log(`Validated: ${request.url} with status: ${request.status}`);
      }
    } catch (error) {
      logger.error('API validation failed:', error);
      throw error; // Rethrow the error to be caught in the main try-catch

    }
  }

  /**
   * Measures the time taken to load the page
   * @returns Promise that resolves to the load time in milliseconds
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    logger.info(`Page load time: ${loadTime}ms`);
    return loadTime;
  }

  /**
   * Tracks API response times for a specific URL pattern
   * @param apiUrlPattern The URL pattern to track
   * @returns Promise that resolves to an array of API response times
   */
  async trackApiResponseTimes(apiUrlPattern: string): Promise<{ url: string; status: number; timeTaken: number }[]> {
    const apiResponseTimes: { url: string; status: number; timeTaken: number }[] = [];

    const requestStartTimes = new Map<string, number>();

    this.page.on('request', (request) => {
      const url = request.url();
      if (url.includes(apiUrlPattern)) {
        requestStartTimes.set(request.url(), Date.now());
      }
    });

    this.page.on('response', async (response) => {
      const url = response.url();
      if (url.includes(apiUrlPattern)) {
        const startTime = requestStartTimes.get(url) ?? Date.now();
        const timeTaken = Date.now() - startTime;
        const status = response.status();

        apiResponseTimes.push({ url, status, timeTaken });

        logger.info(`URL: ${url} >> Status: ${status} >> Time Taken: ${timeTaken}ms`);
      }
    });

    return apiResponseTimes;
  }


  /**
   * Checks the page title against an expected value
   * @param expectedTitle Expected page title
   * @returns Promise that resolves to true if the title matches, false otherwise
   */
  async checkPageTitle(expectedTitle: string): Promise<boolean> {
    try {
      await this.page.waitForLoadState('domcontentloaded');
      const actualTitle = await this.page.title();
      if (actualTitle === expectedTitle) {
        logger.info(`Page title is as expected: ${actualTitle}`);
        return true;
      } else {
        logger.error(`Page title mismatch. Expected: "${expectedTitle}", Actual: "${actualTitle}"`);
        return false;
      }
    } catch (error) {
      logger.error('Failed to check page title:', error);
      return false;
    }
  }

  /**
   * Clicks the first link in a table and returns its text and href
   * Matched search result always display as the first link in the table
   * @returns Promise that resolves to an object containing the link text and href
   */
  async clickFirstLinkInTable(): Promise<{ text: string; href: string }> {
    let foundLinkText = '';
    let foundLink = '';
    await this.page.locator("table").waitFor({ timeout: 90000 });
    const tableRows = this.page.locator("table tr");

    const cells = tableRows.locator("td");

    // Get all cells
    const numCells = await cells.count();

    for (let i = 0; i < numCells; i++) {
      const cell = cells.nth(i);
      const hasLink = await cell.locator("a").isVisible();

      if (hasLink) {
        const link = await cell.locator("a").first();
        foundLinkText = await link.innerText();
        foundLink = await link.getAttribute('href') as string;
        await link.click();
        break; // Stop once clicked
      }
    }
    console.log('Found link text:', foundLinkText);
    console.log('Found link href:', foundLink);

    return { text: foundLinkText, href: foundLink };
  }


  async clickFirstLinkInTableWithTableId(): Promise<{ text: string; href: string }> {
    await this.page.waitForTimeout(5000);
    let foundLinkText = '';
    let foundLink = '';
    await this.page.locator("#DataTables_Table_0").waitFor({ timeout: 90000 });
    const tableRows = this.page.locator("table tr");

    const cells = tableRows.locator("td");

    // Get all cells
    const numCells = await cells.count();

    for (let i = 0; i < numCells; i++) {
      const cell = cells.nth(i);
      const hasLink = await cell.locator("a").isVisible();

      if (hasLink) {
        const link = await cell.locator("a").first();
        foundLinkText = await link.innerText();
        foundLink = await link.getAttribute('href') as string;
        await link.click();
        break; // Stop once clicked
      }
    }

    return { text: foundLinkText, href: foundLink };
  }

  /**
 * Checks if an input field enforces a maximum character limit correctly.
 * 
 * @param locator - Playwright Locator for the input field
 * @param maxChars - Expected maximum number of characters allowed
 * @param inputType - "text" | "number" | "mixed"  (default: "text")
 * @returns Promise<boolean> - true if limit works correctly, false otherwise
 */
 async checkMaxCharacterLimit(
  locator: Locator,
  maxChars: number,
  inputType: 'text' | 'number' | 'mixed' = 'text'
): Promise<boolean> {
  try {
    await expect(locator).toBeVisible();

    // Generate input text based on type
    let longText = '';
    switch (inputType) {
      case 'number':
        longText = '1234567890'.repeat(Math.ceil((maxChars + 10) / 10)).slice(0, maxChars + 10);
        break;
      case 'mixed':
        longText = 'A1B2C3D4E5'.repeat(Math.ceil((maxChars + 10) / 10)).slice(0, maxChars + 10);
        break;
      default: // 'text'
        longText = 'A'.repeat(maxChars + 10);
    }

    // Clear and type the generated text
    await locator.fill(longText);

    // Retrieve the actual input value
    const value = await locator.inputValue();

    // Log details for debugging
    console.log(`Type: ${inputType}, Expected max: ${maxChars}, Actual: ${value.length}`);

    // Return true if value respects the limit
    return value.length <= maxChars;
  } catch (error) {
    console.error('Error checking max character limit:', error);
    return false;
  }
}

}
