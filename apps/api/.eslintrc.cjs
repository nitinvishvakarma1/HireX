/* ESLint config for @hirex/api (NestJS + TypeScript strict).
 * Prettier owns formatting (root .prettierrc / `npm run format`); this config
 * focuses on correctness and type-safety rules. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.cjs', 'dist/', 'node_modules/', 'coverage/'],
  rules: {
    // Rulebook §2: no console.log in committed code — use the structured logger.
    'no-console': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
  },
};
