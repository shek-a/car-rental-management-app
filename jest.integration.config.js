module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
  globalSetup: "<rootDir>/test/integration/global-setup.ts",
  globalTeardown: "<rootDir>/test/integration/global-teardown.ts",
  testMatch: ["**/*.integration.test.ts"],
  testTimeout: 30000,
};
