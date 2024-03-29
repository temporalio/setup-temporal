module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'eslint-config-prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
      },
    ],
    'no-console': 'error',
    yoda: 'error',
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
      },
    ],
    'no-control-regex': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
  },
  overrides: [
    {
      files: ['**/*{test,spec}.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
      },
    },
  ],
  env: {
    node: true,
    es6: true,
  },
};
