module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+node_modules[/\\\\]expo-router[/\\\\].+\\.js$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      },
    ],
    // React Navigation ships ESM; exercise its real router in auth routing tests.
    '^.+node_modules[/\\\\]@react-navigation[/\\\\]routers[/\\\\].+\\.js$': [
      'ts-jest',
      { tsconfig: { allowJs: true, module: 'CommonJS' } },
    ],
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@react-navigation/routers/|expo-router/)',
  ],
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
