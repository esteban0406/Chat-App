import { resetDB } from './helpers/db';

export default async function globalSetup() {
  await resetDB();
}
