#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Running all tests and generating coverage reports...");

// Run backend tests
console.log("Running backend tests...");
try {
  execSync("cd backend && npm test", { stdio: "inherit" });
} catch (error) {
  console.error("Backend tests failed:", error.message);
}

// Run frontend unit tests
console.log("Running frontend unit tests...");
try {
  execSync("cd frontend && npm run test:unit", { stdio: "inherit" });
} catch (error) {
  console.error("Frontend unit tests failed:", error.message);
}

// Run extension tests
console.log("Running extension tests...");
try {
  execSync("cd extension && npm test", { stdio: "inherit" });
} catch (error) {
  console.error("Extension tests failed:", error.message);
}

// Run Cypress e2e tests with coverage
console.log("Running Cypress e2e tests...");
try {
  execSync("cd frontend && CYPRESS_COVERAGE=1 npm run cypress:run", {
    stdio: "inherit",
  });
} catch (error) {
  console.error("Cypress e2e tests failed:", error.message);
}

// Combine coverage reports
console.log("Combining coverage reports...");
try {
  execSync("node tests/combine-coverage.js", { stdio: "inherit" });
} catch (error) {
  console.error("Combining coverage failed:", error.message);
}

console.log(
  "All tests completed. Check coverage reports in respective directories and combined in tests/coverage-combined/"
);
