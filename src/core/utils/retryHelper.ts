import { logger } from './logger';

/**
 * RetryHelper provides utilities to retry flaky operations
 */
export class RetryHelper {
  /**
   * Retries an operation until it succeeds or reaches max attempts
   * @param operation The operation to retry
   * @param maxRetries Maximum number of retry attempts
   * @param retryInterval Delay between retries in milliseconds
   * @param operationName Optional name for logging purposes
   * @returns Result of the operation
   */
  public static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryInterval: number = 1000,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (attempt > 1) {
          logger.info(`Retry attempt ${attempt - 1} for ${operationName}`);
        }
        
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`Successfully completed ${operationName} on retry attempt ${attempt - 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt} failed for ${operationName}: ${error}`);
        
        if (attempt <= maxRetries) {
          logger.info(`Waiting ${retryInterval}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
      }
    }

    logger.error(`All ${maxRetries} retry attempts failed for ${operationName}`);
    throw lastError || new Error(`Failed to execute ${operationName} after ${maxRetries} retries`);
  }

  /**
   * Retries an operation with exponential backoff
   * @param operation The operation to retry
   * @param maxRetries Maximum number of retry attempts
   * @param initialInterval Initial delay in milliseconds
   * @param maxInterval Maximum delay in milliseconds
   * @param operationName Optional name for logging purposes
   * @returns Result of the operation
   */
  public static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialInterval: number = 1000,
    maxInterval: number = 10000,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    let interval = initialInterval;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (attempt > 1) {
          logger.info(`Retry attempt ${attempt - 1} for ${operationName}`);
        }
        
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`Successfully completed ${operationName} on retry attempt ${attempt - 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt} failed for ${operationName}: ${error}`);
        
        if (attempt <= maxRetries) {
          logger.info(`Waiting ${interval}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, interval));
          
          // Calculate next interval with exponential backoff (doubling)
          interval = Math.min(interval * 2, maxInterval);
        }
      }
    }

    logger.error(`All ${maxRetries} retry attempts failed for ${operationName}`);
    throw lastError || new Error(`Failed to execute ${operationName} after ${maxRetries} retries`);
  }
} 
