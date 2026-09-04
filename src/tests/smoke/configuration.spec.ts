import { expect, test } from '@playwright/test';
import config from 'config';

test('local test configuration provides a base URL', () => {
  expect(config.get<string>('baseURL')).toBeTruthy();
});
