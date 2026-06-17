module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[([A-Z][A-Z0-9]+-\d+)\] - (\w+): (.+)$/,
      headerCorrespondence: ['ticket', 'type', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'hotfix',
        'refactor',
        'docs',
        'test',
        'ci',
        'build',
        'chore',
        'perf',
        'revert',
      ],
    ],
    'subject-min-length': [2, 'always', 8],
  },
};
