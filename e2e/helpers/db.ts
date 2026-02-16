import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env.test') });

const TABLES = [
  'Message',
  'Channel',
  'Member',
  'Role',
  'ServerInvite',
  'Friendship',
  'Account',
  'Server',
  'User',
];

export async function resetDB(): Promise<void> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const truncateSQL = TABLES.map(
      (t) => `TRUNCATE TABLE "${t}" CASCADE`
    ).join('; ');
    await client.query(truncateSQL);
  } finally {
    await client.end();
  }
}
