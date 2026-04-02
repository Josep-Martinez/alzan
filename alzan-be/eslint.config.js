const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/',
      'babel.config.js',
      'metro.config.js',
      'dist/',
      'coverage/',
      '.eslintrc.js',
      'src/openapi/generated/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unsafe-member-access': 'error',
    },
  },
);
