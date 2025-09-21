import { fileURLToPath } from 'url';
import path from 'path';

// TypeScript parser y plugin
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

// Angular ESLint plugins
import angularPlugin from '@angular-eslint/eslint-plugin';
import templatePlugin from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  // =========================
  // Archivos TypeScript
  // =========================
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
      // -------------------
      // Angular
      // -------------------
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/prefer-signals': 'warn', // ⚡ Fomenta uso de Signals
      
      // -------------------
      // TypeScript
      // -------------------
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',

      // -------------------
      // Estilo general
      // -------------------
      'prefer-const': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-console': 'warn',
      'no-debugger': 'error',
       'no-duplicate-imports': 'off',
      'max-len': ['warn', { code: 120 }],
    },
  },

  // =========================
  // Archivos HTML / Angular templates
  // =========================
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      '@angular-eslint/template': templatePlugin,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error', // [(ngModel)] correcto
      '@angular-eslint/template/no-negated-async': 'error', // !async en bindings
      '@angular-eslint/template/use-track-by-function': 'warn', // ngFor trackBy
      '@angular-eslint/template/eqeqeq': 'error', // usar ===
      '@angular-eslint/template/click-events-have-key-events': 'warn', // accesibilidad
      '@angular-eslint/template/no-distracting-elements': 'warn', // <marquee>, <blink>
    },
  },

  // =========================
  // Ignorar dist y node_modules
  // =========================
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
