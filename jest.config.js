/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 100000000,
  transformIgnorePatterns: ["^.+\\.js$"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
