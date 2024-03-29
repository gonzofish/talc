module.exports = {
  extends: ['plugin:node/recommended', 'eslint:recommended'],
  plugins: ['prettier'],
  rules: {
    'no-unused-vars': 1,
    'node/no-missing-require': [
      'error',
      {
        allowModules: ['ava'],
      },
    ],
  },
};
