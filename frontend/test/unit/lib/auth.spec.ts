import { login, register, logout, getMe, updateUser, getToken, setToken, removeToken, isAuthenticated } from '@/lib/auth';

jest.mock('@/lib/backend-client', () => ({
  toBackendURL: (path: string) => `http://localhost:4000${path}`,
}));

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  localStorage.clear();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('token management', () => {
  it('getToken returns null when no token stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores token in localStorage', () => {
    setToken('abc');
    expect(localStorage.getItem('accessToken')).toBe('abc');
  });

  it('getToken returns stored token', () => {
    localStorage.setItem('accessToken', 'xyz');
    expect(getToken()).toBe('xyz');
  });

  it('removeToken clears the token', () => {
    localStorage.setItem('accessToken', 'xyz');
    removeToken();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when token exists', () => {
    localStorage.setItem('accessToken', 'xyz');
    expect(isAuthenticated()).toBe(true);
  });
});

describe('login', () => {
  it('calls POST /api/auth/login and stores token', async () => {
    const authResponse = { user: { id: '1', email: 'a@b.com', username: 'u' }, accessToken: 'tok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => authResponse,
    });

    const result = await login('a@b.com', 'password');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(authResponse);
    expect(localStorage.getItem('accessToken')).toBe('tok');
  });

  it('throws error with message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(login('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('throws error with array message joined', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: ['email must be valid', 'password too short'] }),
    });

    await expect(login('bad', 'x')).rejects.toThrow('email must be valid, password too short');
  });
});

describe('register', () => {
  it('calls POST /api/auth/register and stores token', async () => {
    const authResponse = { user: { id: '1', email: 'a@b.com', username: 'u' }, accessToken: 'tok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => authResponse,
    });

    const result = await register('a@b.com', 'password', 'username');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(authResponse);
    expect(localStorage.getItem('accessToken')).toBe('tok');
  });

  it('throws error on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Email taken' }),
    });

    await expect(register('a@b.com', 'pw', 'u')).rejects.toThrow('Email taken');
  });
});

describe('logout', () => {
  it('calls POST /api/auth/logout and removes token', async () => {
    localStorage.setItem('accessToken', 'tok');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await logout();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer tok' },
      }),
    );
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('removes token even when no token stored', async () => {
    await logout();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

describe('getMe', () => {
  it('returns user on success', async () => {
    localStorage.setItem('accessToken', 'tok');
    const user = { id: '1', email: 'a@b.com', username: 'u' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => user,
    });

    const result = await getMe();
    expect(result).toEqual(user);
  });

  it('returns null when no token', async () => {
    const result = await getMe();
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null and removes token on 401', async () => {
    localStorage.setItem('accessToken', 'expired');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await getMe();
    expect(result).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('returns null on non-401 error', async () => {
    localStorage.setItem('accessToken', 'tok');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await getMe();
    expect(result).toBeNull();
  });
});

describe('updateUser', () => {
  it('sends PATCH with username and returns updated user', async () => {
    localStorage.setItem('accessToken', 'tok');
    const updated = { id: '1', email: 'a@b.com', username: 'newname' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => updated,
    });

    const result = await updateUser({ username: 'newname' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/users/me',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result).toEqual(updated);
  });

  it('returns null when no token', async () => {
    const result = await updateUser({ username: 'x' });
    expect(result).toBeNull();
  });

  it('throws on error response', async () => {
    localStorage.setItem('accessToken', 'tok');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Validation failed' }),
    });

    await expect(updateUser({ username: '' })).rejects.toThrow('Validation failed');
  });
});
