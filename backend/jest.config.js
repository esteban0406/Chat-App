export default {
  testEnvironment: "node",
  transform: {}, 
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/test/**",
    "!src/**/index.js"
  ]
};
