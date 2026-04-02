const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const unusedImports = require('eslint-plugin-unused-imports');
const i18next = require('eslint-plugin-i18next');

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
      '**/icons/**', // Ignore icon files (SVG paths are not translatable)
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
      i18next: i18next,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // i18next rules for detecting hardcoded strings
      'i18next/no-literal-string': [
        'error',
        {
          words: {
            // Whitelist strings: preserve defaults while adding single characters and specific units
            exclude: [
              /[0-9!-/:-@\[-`{-~]+/, // Default: numbers and punctuation
              /^[\p{Emoji}\uFE0F\u200D]+$/u, // Default+ tweaks for variation selectors: emojis
              /^.$/, // Any single character ('h', 's', 'm', 'x', 'g', '✓', etc.)
              /^h( : )?$/, // 'h' or 'h : '
              /^m( )?$/, // 'm' or 'm '
              /^W:$/, // 'W:'
            ],
          },
        },
      ],
      '@typescript-eslint/no-unsafe-member-access': 'error',
    },
  },
);
