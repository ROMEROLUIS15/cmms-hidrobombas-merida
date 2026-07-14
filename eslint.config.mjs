import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';

export default [
  // ── Archivos a ignorar globalmente ────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.husky/**',
      '**/package-lock.json',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
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
        ...globals.node,
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
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'multi-line'],
    },
  },

  // ── Pruebas de carga (k6) ─────────────────────────────────────────────────
  // k6 NO es Node: corre los scripts en su propio runtime (goja), con módulos ES
  // y unos globales propios (__ENV, __VU, __ITER). Sin este bloque, ESLint
  // parsearía estos .js como CommonJS y los `import` reventarían el lint de CI.
  {
    files: ['k6/**/*.js'],
    ...pluginJs.configs.recommended,
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
        console: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // En k6 la consola es la salida legítima del teardown/summary.
      'no-console': 'off',
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
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'multi-line'],
    },
  },
];