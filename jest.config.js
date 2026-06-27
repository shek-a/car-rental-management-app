module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
  // Integration tests run via `yarn test:integration` (they require Docker).
  testPathIgnorePatterns: ["/node_modules/", "/test/integration/"],
};
