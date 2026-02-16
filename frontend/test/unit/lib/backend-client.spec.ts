import { toBackendURL, backendFetch, unwrapList, extractErrorMessage } from '@/lib/backend-client';

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

import { getToken } from '@/lib/auth';
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

const originalFetch = global.fetch;

function mockResponse(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('toBackendURL', () => {
  const ENV_KEY = 'NEXT_PUBLIC_BACKEND_URL';

  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('prepends backend base URL to path', () => {
    process.env[ENV_KEY] = 'http://localhost:4000';
    expect(toBackendURL('/api/test')).toBe('http://localhost:4000/api/test');
  });

  it('strips trailing slash from base URL', () => {
    process.env[ENV_KEY] = 'http://localhost:4000/';
    expect(toBackendURL('/api/test')).toBe('http://localhost:4000/api/test');
  });

  it('adds leading slash if missing from path', () => {
    process.env[ENV_KEY] = 'http://localhost:4000';
    expect(toBackendURL('api/test')).toBe('http://localhost:4000/api/test');
  });

  it('returns just the path when env is not set', () => {
    delete process.env[ENV_KEY];
    expect(toBackendURL('/api/test')).toBe('/api/test');
  });
});

describe('backendFetch', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:4000';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
  });

  it('injects Authorization header when token exists', async () => {
    mockGetToken.mockReturnValue('my-token');
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({}));

    await backendFetch('/api/test');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('does not inject Authorization header when no token', async () => {
    mockGetToken.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({}));

    await backendFetch('/api/test');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('passes options through to fetch', async () => {
    mockGetToken.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({}));

    await backendFetch('/api/test', { method: 'POST', body: '{}' });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:4000/api/test');
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{}');
  });
});

describe('unwrapList', () => {
  it('extracts from nested data object', () => {
    const body = { data: { items: [1, 2, 3] } };
    expect(unwrapList(body, 'items')).toEqual([1, 2, 3]);
  });

  it('extracts from direct key', () => {
    const body = { friends: [{ id: '1' }] };
    expect(unwrapList(body, 'friends')).toEqual([{ id: '1' }]);
  });

  it('returns body directly when body is array', () => {
    const body = [1, 2, 3];
    expect(unwrapList(body, 'anything')).toEqual([1, 2, 3]);
  });

  it('returns empty array for null body', () => {
    expect(unwrapList(null, 'items')).toEqual([]);
  });

  it('returns empty array when key not found', () => {
    expect(unwrapList({ other: 'data' }, 'items')).toEqual([]);
  });

  it('prefers nested data over direct key', () => {
    const body = { data: { items: ['nested'] }, items: ['direct'] };
    expect(unwrapList(body, 'items')).toEqual(['nested']);
  });
});

describe('extractErrorMessage', () => {
  it('returns string message from response body', async () => {
    const res = mockResponse({ message: 'Not found' }, { ok: false, status: 404 });
    const msg = await extractErrorMessage(res, 'fallback');
    expect(msg).toBe('Not found');
  });

  it('joins array message from response body', async () => {
    const res = mockResponse({ message: ['err1', 'err2'] }, { ok: false, status: 400 });
    const msg = await extractErrorMessage(res, 'fallback');
    expect(msg).toBe('err1, err2');
  });

  it('returns fallback when no message field', async () => {
    const res = mockResponse({ error: 'something' }, { ok: false, status: 500 });
    const msg = await extractErrorMessage(res, 'fallback');
    expect(msg).toBe('fallback');
  });

  it('returns fallback when json parsing fails', async () => {
    const res = {
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    } as unknown as Response;
    const msg = await extractErrorMessage(res, 'fallback');
    expect(msg).toBe('fallback');
  });
});
