module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(test|spec).+(js)', '**/?(*.)+(spec|test).+(js)'],
  // Transpila JS con babel-jest (usa backend/babel.config.js).
  transform: {
    '^.+\\.[cm]?jsx?$': 'babel-jest',
  },
  // Por defecto Jest ignora node_modules al transformar. Excluimos de ese
  // "ignore" al ecosistema langchain (y deps ESM-only que arrastra) para que
  // SÍ se transpilen a CommonJS y Jest pueda importarlos.
  transformIgnorePatterns: [
    '/node_modules/(?!(@langchain|langchain|langsmith|@cfworker|js-tiktoken|uuid|p-queue|p-timeout|p-retry|eventemitter3|retry|mustache|decamelize|camelcase|@ungap)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.mock.js',
    '!src/config/*',
    '!src/server.js',
    '!src/app.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  setupFiles: ['<rootDir>/jest.setupEnv.js'],
  testTimeout: 15000
};
