module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(test|spec).+(js)', '**/?(*.)+(spec|test).+(js)'],
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
  testTimeout: 15000
};