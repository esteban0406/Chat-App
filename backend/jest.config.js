// jest.config.js
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  rootDir: __dirname,
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  transform: {},
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/test/**",
    "!src/**/index.js",
  ],
  testTimeout: 20000,
};
