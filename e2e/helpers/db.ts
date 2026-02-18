const BACKEND_URL = 'http://localhost:4000';

export async function resetDB(): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/test/reset`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`resetDB failed: ${res.status} ${res.statusText}`);
  }
}
