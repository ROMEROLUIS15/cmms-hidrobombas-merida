module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/frontend/build/**',
      '**/backend/coverage/**',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
    ],
  },
  {
    files: ['frontend/**/*.js', 'frontend/**/*.jsx'],
    ...require('./frontend/eslint.config.js'),
  },
  {
    files: ['backend/**/*.js', 'src/**/*.js'],
    ...require('./backend/eslint.config.js'),
  },
];