import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';

export default [
  // ── Archivos a ignorar globalmente ────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/frontend/build/**',
      '**/frontend/dist/**',
      '**/backend/coverage/**',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/package-lock.json',
    ],
  },

  // ── Frontend (React / JSX) ────────────────────────────────────────────────
  {
    files: ['frontend/src/**/*.js', 'frontend/src/**/*.jsx'],
    ...pluginJs.configs.recommended,
    plugins: { react: pluginReact },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'multi-line'],
    },
  },

  // ── Backend (Node.js / CommonJS) ──────────────────────────────────────────
  {
    files: ['backend/src/**/*.js'],
    ...pluginJs.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];