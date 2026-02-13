import { JwtStrategy } from '../../../../../src/modules/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('transforms payload to user object', () => {
    const payload = { sub: 'u1', email: 'a@a.com', username: 'alice' };
    const result = strategy.validate(payload);

    expect(result).toEqual({ id: 'u1', email: 'a@a.com', username: 'alice' });
  });
});
