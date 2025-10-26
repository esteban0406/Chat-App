export default {
  testEnvironment: "node",
  transform: {},
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/test/**",
    "!src/**/index.js"
  ],

  // 👇 Hook que se ejecuta antes de cualquier test
  setupFiles: ["<rootDir>/jest.setup.js"],
};
