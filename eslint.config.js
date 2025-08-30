import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Global ignores (must be first)
  {
    ignores: [
      'node_modules/**',
      'frontend/dist/**',
      'backend/**',
      '.venv/**',
      '**/*.d.ts',
      'vite.config.ts',
      'frontend/tests/**',
      'jest.config.cjs',
    ],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript files (frontend source only)
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Basic TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-redeclare': 'off', // TypeScript handles this
    },
  },

  // Vue files - base config
  ...vue.configs['flat/recommended'],

  // Vue files with TypeScript
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Vue-specific rules
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/valid-template-root': 'off', // Allow empty templates for headless components
      'vue/attributes-order': 'warn', // Make less strict
      'vue/v-slot-style': 'warn', // Make less strict
      // TypeScript in Vue
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-redeclare': 'off', // TypeScript handles this
    },
  },

  // Node.js config files
  {
    files: ['*.cjs', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier compatibility (must be last)
  prettier,
];
