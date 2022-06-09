const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  // NOTE -> Currently the jest-mongodb package has a bug where it doesn't work on Ubuntu 22.04
  // so if needing to run tests locally on Ubuntu 22.04, the following line must be commented out
  // and test files that use the in-memory DB are not supported. Tests work fine in the GH Actions CI
  preset: '@shelf/jest-mongodb',
  verbose: true,
  testTimeout: 100000000,
  transform: tsjPreset.transform,
  transformIgnorePatterns: ['^.+\\.js$'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  resetMocks: true,
};
