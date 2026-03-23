import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'lib',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/lib/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/components/__tests__/**/*.test.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            esModuleInterop: true,
            module: 'commonjs',
            moduleResolution: 'node',
            strict: true,
            baseUrl: '.',
            paths: {
              '@/*': ['./src/*'],
            },
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
