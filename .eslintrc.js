module.exports = {
  extends: 'google',
  env: {
    node: true,
    mocha: true
  },
  plugins: [
    'pabigot'
  ],
  rules: {
    camelcase: 'off',
    curly: 'error',
    'guard-for-in': 'off',
    'max-len': ['error', {code: 120, tabWidth: 2}],
    'new-cap': 'off',
    'no-constant-condition': 'off',
    'no-implicit-coercion': 'off',
    'operator-linebreak': ['error', 'before'],
    'pabigot/affixed-ids': ['error', {
      allowedSuffixes: [
        '_dCel',
        '_ppt'
      ]
    }],
    quotes: ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    yoda: ['error', 'always', {exceptRange: true}]
  },
  parserOptions: {
    sourceType: 'module'
  }
}
