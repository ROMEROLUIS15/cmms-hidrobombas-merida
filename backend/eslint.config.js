const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  pluginJs.configs.recommended,
  {
    // Ignore test files from strict lint rules — they run under Jest
    // and legitimately use console for test output.
    ignores: ['src/__tests__/**'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: 'commonjs',
    },
    rules: {
      // Unused vars: error, but allow _ prefix for intentional omissions
      // and Express `next` parameter by argsIgnorePattern
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^(_|next)',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Console: warn/error are allowed (startup logs, error handling).
      // console.log is NOT allowed — use console.warn or console.error.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      'eqeqeq':      ['error', 'always'],
      'no-var':       'error',
      'prefer-const': 'error',
      'semi':         ['error', 'always'],
      'quotes':       ['error', 'single'],
      'curly':        ['error', 'multi-line'],
    },
  },
];
