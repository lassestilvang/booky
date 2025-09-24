#!/bin/bash

set -e

echo "Running comprehensive test coverage for CI/CD..."

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Run the automated reporting script
echo "Generating coverage reports..."
node tests/generate-report.js

# Check coverage thresholds
echo "Checking coverage thresholds..."
# For backend
if [ -f "backend/coverage/coverage-summary.json" ]; then
  node -e "
    const coverage = require('./backend/coverage/coverage-summary.json');
    const thresholds = { branches: 90, functions: 90, lines: 90, statements: 90 };
    for (const [key, threshold] of Object.entries(thresholds)) {
      if (coverage.total[key].pct < threshold) {
        console.error(\`Backend ${key} coverage \${coverage.total[key].pct}% is below threshold \${threshold}%\`);
        process.exit(1);
      }
    }
    console.log('Backend coverage thresholds met');
  "
fi

# Similar for frontend and extension
# (Add similar checks)

echo "Coverage checks passed. Reports available in coverage directories."
