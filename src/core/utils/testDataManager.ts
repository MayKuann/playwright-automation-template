import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/**
 * TestDataManager provides utility functions for managing test data
 * - Load test data from JSON files
 * - Get test data by key
 * - Generate random test data
 */
export class TestDataManager {
  private static instance: TestDataManager;
  private dataCache: Map<string, any> = new Map();
  private readonly dataDir: string;

  /**
   * Private constructor (singleton pattern)
   * @param dataDirectory Directory where test data files are stored
   */
  private constructor(dataDirectory: string = './config/testData') {
    this.dataDir = dataDirectory;
    this.ensureDirectoryExists(dataDirectory);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(dataDirectory?: string): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager(dataDirectory);
    }
    return TestDataManager.instance;
  }

  /**
   * Load test data from a JSON file
   * @param fileName Name of the JSON file (without extension)
   * @returns Test data object
   */
  public loadTestData(fileName: string): any {
    const filePath = path.join(this.dataDir, `${fileName}.json`);

    if (this.dataCache.has(filePath)) {
      logger.debug(`Loading test data from cache: ${fileName}`);
      return this.dataCache.get(filePath);
    }

    try {
      logger.debug(`Loading test data from file: ${filePath}`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.dataCache.set(filePath, data);
      return data;
    } catch (error) {
      logger.error(`Failed to load test data from ${filePath}: ${error}`);
      throw new Error(`Failed to load test data from ${filePath}: ${error}`);
    }
  }

  /**
   * Get test data by key from a loaded data set
   * @param dataSet Data set object
   * @param key Key to retrieve
   * @returns Value for the key
   */
  public getByKey(dataSet: any, key: string): any {
    const value = dataSet[key];
    if (value === undefined) {
      logger.warn(`Test data key not found: ${key}`);
    }
    return value;
  }

  /**
   * Generate a random email address
   * @returns Random email
   */
  public generateRandomEmail(): string {
    return `test-${Math.floor(Math.random() * 1000000)}@example.com`;
  }

  /**
   * Generate a random username
   * @returns Random username
   */
  public generateRandomUsername(): string {
    return `user_${Math.floor(Math.random() * 1000000)}`;
  }

  /**
   * Generate a random string of specified length
   * @param length Length of the string
   * @returns Random string
   */
  public generateRandomString(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Ensure the data directory exists
   * @param directory Directory path
   */
  private ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
      logger.info(`Creating test data directory: ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }
  }
}

export const testDataManager = TestDataManager.getInstance(); 