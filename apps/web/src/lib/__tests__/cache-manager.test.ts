import { getCacheConfig, isCacheExpired, getCacheAge } from '../cache-manager';

describe('getCacheConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.KEYWORD_ANALYSIS_CACHE_HOURS;
    delete process.env.CONTENT_ANALYSIS_CACHE_HOURS;
    delete process.env.ACCOUNT_ANALYSIS_CACHE_HOURS;
    delete process.env.HOTLIST_DATA_CACHE_HOURS;

    const config = getCacheConfig();
    expect(config.keywordAnalysis).toBe(24);
    expect(config.contentAnalysis).toBe(6);
    expect(config.accountAnalysis).toBe(12);
    expect(config.hotlistData).toBe(3);
  });

  it('should read from env vars when set', () => {
    process.env.KEYWORD_ANALYSIS_CACHE_HOURS = '48';
    process.env.CONTENT_ANALYSIS_CACHE_HOURS = '12';

    const config = getCacheConfig();
    expect(config.keywordAnalysis).toBe(48);
    expect(config.contentAnalysis).toBe(12);
  });
});

describe('isCacheExpired', () => {
  it('should return false for fresh cache', () => {
    const now = new Date();
    expect(isCacheExpired(now, 6)).toBe(false);
  });

  it('should return false for cache within window', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(isCacheExpired(threeHoursAgo, 6)).toBe(false);
  });

  it('should return true for expired cache', () => {
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
    expect(isCacheExpired(sevenHoursAgo, 6)).toBe(true);
  });

  it('should return true for exactly expired cache', () => {
    // Just past the window
    const exactlyExpired = new Date(Date.now() - 6 * 60 * 60 * 1000 - 1000);
    expect(isCacheExpired(exactlyExpired, 6)).toBe(true);
  });
});

describe('getCacheAge', () => {
  it('should return "刚刚" for very recent cache', () => {
    const now = new Date();
    expect(getCacheAge(now)).toBe('刚刚');
  });

  it('should return minutes for recent cache', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(getCacheAge(tenMinutesAgo)).toBe('10分钟前');
  });

  it('should return hours for older cache', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(getCacheAge(threeHoursAgo)).toBe('3小时前');
  });

  it('should return days for old cache', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(getCacheAge(twoDaysAgo)).toBe('2天前');
  });
});
