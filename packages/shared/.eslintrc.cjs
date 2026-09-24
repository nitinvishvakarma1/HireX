/**
 * ESLint config for @hirex/shared.
 * Type-aware linting for a pure TypeScript library (no DOM/React here).
 */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
  ],
  rules: {
    // Enforce intention-revealing, unused-free code (rulebook §2).
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Shared contracts must be explicit; forbid implicit `any` leaking across apps.
    '@typescript-eslint/no-explicit-any': 'error',
    // No stray console logging in committed shared code (rulebook §2, §9).
    'no-console': 'error',
    'eqeqeq': ['error', 'always'],
  },
  ignorePatterns: ['dist/', 'node_modules/', '.eslintrc.cjs'],
};
