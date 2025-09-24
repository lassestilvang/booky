#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const coverageDirs = [
  path.join(__dirname, "../backend/coverage"),
  path.join(__dirname, "../frontend/coverage"),
  path.join(__dirname, "../extension/coverage"),
  path.join(__dirname, "../frontend/coverage-cypress"),
];

const combinedDir = path.join(__dirname, "coverage-combined");

// Ensure combined directory exists
if (!fs.existsSync(combinedDir)) {
  fs.mkdirSync(combinedDir, { recursive: true });
}

// Copy coverage files from each component
coverageDirs.forEach((dir, index) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      if (file.endsWith(".json") || file.endsWith(".info")) {
        const src = path.join(dir, file);
        const dest = path.join(combinedDir, `${index}-${file}`);
        fs.copyFileSync(src, dest);
      }
    });
  }
});

// Generate combined HTML report using istanbul
try {
  execSync(
    `npx istanbul report --include "${combinedDir}/*.json" --dir "${combinedDir}/html" html`,
    { stdio: "inherit" }
  );
  execSync(
    `npx istanbul report --include "${combinedDir}/*.json" --dir "${combinedDir}" lcov`,
    { stdio: "inherit" }
  );
  console.log("Combined coverage report generated in tests/coverage-combined/");
} catch (error) {
  console.error("Failed to generate combined report:", error.message);
  process.exit(1);
}
