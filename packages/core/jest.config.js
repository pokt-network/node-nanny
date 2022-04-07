const { defaults: tsjPreset } = require("ts-jest/presets");

module.exports = {
  preset: "@shelf/jest-mongodb",
  verbose: true,
  testTimeout: 100000000,
  transform: tsjPreset.transform,
};
