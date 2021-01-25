export default {
  resolver: "jest-ts-webcompat-resolver",
  preset: "ts-jest",
  testEnvironment: "jsdom",
  collectCoverage: true,
  testMatch: ["**/*.test.ts"],
};
