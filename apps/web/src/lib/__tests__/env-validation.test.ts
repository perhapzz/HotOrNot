import { validateEnv } from '../env-validation';

describe('validateEnv', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should pass when all required vars are set', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.TIKHUB_API_KEY = 'real_key_abc123';
    process.env.GEMINI_API_KEY = 'real_key_def456';
    process.env.JWT_SECRET = 'super_secret_key';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should throw when MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;
    process.env.TIKHUB_API_KEY = 'real_key';
    process.env.GEMINI_API_KEY = 'real_key';
    process.env.JWT_SECRET = 'secret';

    expect(() => validateEnv()).toThrow('MONGODB_URI');
  });

  it('should throw when JWT_SECRET is missing', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.TIKHUB_API_KEY = 'real_key';
    process.env.GEMINI_API_KEY = 'real_key';
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow('JWT_SECRET');
  });

  it('should throw when value is a placeholder', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.TIKHUB_API_KEY = 'your_tikhub_api_key_here';
    process.env.GEMINI_API_KEY = 'real_key';
    process.env.JWT_SECRET = 'secret';

    expect(() => validateEnv()).toThrow('占位符');
  });

  it('should throw with multiple missing vars listed', () => {
    delete process.env.MONGODB_URI;
    delete process.env.TIKHUB_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow('MONGODB_URI');
  });

  it('should warn for optional vars but not throw', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.TIKHUB_API_KEY = 'real_key';
    process.env.GEMINI_API_KEY = 'real_key';
    process.env.JWT_SECRET = 'secret';
    delete process.env.IP_HASH_SALT;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    validateEnv();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('IP_HASH_SALT'));
    warnSpy.mockRestore();
  });
});
