const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  pluginJs.configs.recommended,
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
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }], // Ignore Express `next` parameter if unused
      'no-console': 'warn', // Allow console.log for now, but warn
      'eqeqeq': ['error', 'always'], // Require === and !==
      'no-var': 'error', // Prefer const or let
      'prefer-const': 'error', // Prefer const if not reassigned
      'semi': ['error', 'always'], // Require semicolons
      'quotes': ['error', 'single'], // Prefer single quotes
      'curly': ['error', 'multi-line'], // Require curly braces for multi-line blocks
    },
  },
];
