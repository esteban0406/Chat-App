import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'node:path';

dotenvConfig({ path: resolve(process.cwd(), '.env.test'), quiet: true });
process.env.NODE_ENV = 'test';
