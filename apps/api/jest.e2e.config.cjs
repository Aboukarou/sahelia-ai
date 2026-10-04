module.exports = {
  clearMocks: true,
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  setupFiles: ["reflect-metadata", "<rootDir>/test/setup-e2e.cjs"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  testTimeout: 30000,
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.e2e.json" }],
  },
};
