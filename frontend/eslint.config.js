const globals = require('globals');
const pluginJs = require('@eslint/js');
const pluginReact = require('eslint-plugin-react');

module.exports = [
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // We will rely on JSDoc/Zod instead
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'multi-line'],
    },
  },
];
