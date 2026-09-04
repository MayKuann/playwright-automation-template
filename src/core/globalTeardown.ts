import { logger } from './utils/logger';

async function globalTeardown(): Promise<void> {
  logger.info('Local test run completed');
}

export default globalTeardown;
