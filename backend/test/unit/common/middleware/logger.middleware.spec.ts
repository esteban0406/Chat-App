import { Request, Response } from 'express';
import { HTTPLoggerMiddleware } from '../../../../src/common/middleware/logger.middleware';

describe('HTTPLoggerMiddleware', () => {
  let middleware: HTTPLoggerMiddleware;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new HTTPLoggerMiddleware();

    logSpy = jest
      .spyOn(
        (middleware as never as Record<string, any>)['logger'] as Record<
          string,
          any
        >,
        'log',
      )
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const makeReq = (overrides: Record<string, unknown> = {}): Request =>
    ({
      method: 'GET',
      originalUrl: '/api/test',
      body: {},
      ...overrides,
    }) as unknown as Request;

  const res = {} as unknown as Response;

  it('logs method and URL when body is empty', () => {
    const next = jest.fn();
    middleware.use(makeReq(), res, next);

    expect(logSpy).toHaveBeenCalledWith('Request: [GET] /api/test');
    expect(next).toHaveBeenCalled();
  });

  it('logs method, URL and body when body is present', () => {
    const next = jest.fn();
    middleware.use(makeReq({ body: { name: 'test' } }), res, next);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('with body:'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"name":"test"'),
    );
    expect(next).toHaveBeenCalled();
  });

  it('redacts password and token fields', () => {
    const next = jest.fn();
    middleware.use(
      makeReq({ body: { password: 'secret', token: 'jwt123', name: 'ok' } }),
      res,
      next,
    );

    const loggedMessage = (logSpy.mock.calls as string[][])[0][0];
    expect(loggedMessage).toContain('[REDACTED]');
    expect(loggedMessage).not.toContain('secret');
    expect(loggedMessage).not.toContain('jwt123');
    expect(loggedMessage).toContain('"name":"ok"');
  });

  it('calls next()', () => {
    const next = jest.fn();
    middleware.use(makeReq(), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
