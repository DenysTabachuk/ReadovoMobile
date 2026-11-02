module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
