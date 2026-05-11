module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
    '^axios$': '<rootDir>/__mocks__/axios.js',
    '^sonner$': '<rootDir>/__mocks__/sonner.js'
  },
  testMatch: ['**/__tests__/**/*.test.(js|jsx)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.mock.{js,jsx}',
    '!src/index.{js,jsx}'
  ],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 15000
};
