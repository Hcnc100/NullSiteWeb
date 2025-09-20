import { fileURLToPath } from 'url';
import path from 'path';

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angularPlugin from '@angular-eslint/eslint-plugin';
import templatePlugin from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  // TypeScript
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@angular-eslint': angularPlugin,
    },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'prefer-const': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-console': 'warn',
    },
  },

  // HTML / Angular templates
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      '@angular-eslint/template': templatePlugin,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
    '@angular-eslint/template/no-negated-async': 'error',
    '@angular-eslint/template/use-track-by-function': 'warn',
    '@angular-eslint/template/eqeqeq': 'error',
    '@angular-eslint/template/click-events-have-key-events': 'warn',
    '@angular-eslint/template/no-distracting-elements': 'warn',
    },
  },

  // Ignorar solo dist y node_modules
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
