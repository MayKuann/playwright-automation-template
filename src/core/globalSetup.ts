import * as fs from 'fs';
import * as path from 'path';
import { logger } from './utils/logger';

/** Creates the local folders used for test evidence. */
async function globalSetup(): Promise<void> {
  for (const directory of ['logs', 'screenshots', 'test-results']) {
    const directoryPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  logger.info('Local test setup completed');
}

export default globalSetup;
