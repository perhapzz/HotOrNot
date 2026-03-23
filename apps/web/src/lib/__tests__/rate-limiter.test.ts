import { checkRateLimit, getConfigForPath, RATE_LIMIT_CONFIGS } from '../rate-limiter';

describe('getConfigForPath', () => {
  it('should match /api/analysis routes', () => {
    const config = getConfigForPath('/api/analysis/content');
    expect(config).toBe(RATE_LIMIT_CONFIGS['/api/analysis']);
  });

  it('should match /api/auth routes', () => {
    const config = getConfigForPath('/api/auth/login');
    expect(config).toBe(RATE_LIMIT_CONFIGS['/api/auth']);
  });

  it('should match /api/hotlist routes', () => {
    const config = getConfigForPath('/api/hotlist/xiaohongshu');
    expect(config).toBe(RATE_LIMIT_CONFIGS['/api/hotlist']);
  });

  it('should match /api/admin routes', () => {
    const config = getConfigForPath('/api/admin/init');
    expect(config).toBe(RATE_LIMIT_CONFIGS['/api/admin']);
  });

  it('should fall back to default /api for unknown routes', () => {
    const config = getConfigForPath('/api/unknown/route');
    expect(config).toBe(RATE_LIMIT_CONFIGS['/api']);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clear the internal store between tests by using unique IPs
  });

  it('should allow requests within limit', () => {
    const ip = `test-${Date.now()}-allow`;
    const result = checkRateLimit(ip, '/api/admin/init');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT_CONFIGS['/api/admin'].max - 1);
  });

  it('should block requests exceeding limit', () => {
    const ip = `test-${Date.now()}-block`;
    const max = RATE_LIMIT_CONFIGS['/api/admin'].max; // 5

    for (let i = 0; i < max; i++) {
      const r = checkRateLimit(ip, '/api/admin/test');
      expect(r.allowed).toBe(true);
    }

    const blocked = checkRateLimit(ip, '/api/admin/test');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('should track different IPs independently', () => {
    const ip1 = `test-${Date.now()}-ip1`;
    const ip2 = `test-${Date.now()}-ip2`;

    const max = RATE_LIMIT_CONFIGS['/api/admin'].max;
    for (let i = 0; i < max; i++) {
      checkRateLimit(ip1, '/api/admin/test');
    }

    const blockedIp1 = checkRateLimit(ip1, '/api/admin/test');
    expect(blockedIp1.allowed).toBe(false);

    const allowedIp2 = checkRateLimit(ip2, '/api/admin/test');
    expect(allowedIp2.allowed).toBe(true);
  });

  it('should track different route prefixes independently', () => {
    const ip = `test-${Date.now()}-routes`;

    const adminMax = RATE_LIMIT_CONFIGS['/api/admin'].max;
    for (let i = 0; i < adminMax; i++) {
      checkRateLimit(ip, '/api/admin/test');
    }

    const blockedAdmin = checkRateLimit(ip, '/api/admin/test');
    expect(blockedAdmin.allowed).toBe(false);

    // Same IP but different route should still be allowed
    const allowedAuth = checkRateLimit(ip, '/api/auth/login');
    expect(allowedAuth.allowed).toBe(true);
  });

  it('should return correct limit value', () => {
    const ip = `test-${Date.now()}-limit`;
    const result = checkRateLimit(ip, '/api/analysis/content');
    expect(result.limit).toBe(RATE_LIMIT_CONFIGS['/api/analysis'].max);
  });
});
