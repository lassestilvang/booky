#!/bin/bash

set -e

echo "Testing CI/CD pipeline configurations..."

# Test workflow YAML syntax
echo "Validating workflow YAML syntax..."
if command -v yamllint >/dev/null 2>&1; then
    yamllint .github/workflows/ci.yml
    echo "YAML syntax validation passed"
else
    echo "yamllint not available, skipping YAML validation"
fi

# Test that required jobs are present
echo "Checking required jobs in CI workflow..."
if grep -q "jobs:" .github/workflows/ci.yml && \
   grep -q "backend:" .github/workflows/ci.yml && \
   grep -q "frontend:" .github/workflows/ci.yml; then
    echo "Required jobs found in workflow"
else
    echo "ERROR: Required jobs missing from workflow"
    exit 1
fi

# Test that build steps are present
echo "Checking build steps..."
if grep -q "npm run build" .github/workflows/ci.yml; then
    echo "Build steps found"
else
    echo "ERROR: Build steps missing"
    exit 1
fi

# Test automated testing workflows (placeholder - add when tests are added to CI)
echo "Checking for automated testing workflows..."
if grep -q "test" .github/workflows/ci.yml; then
    echo "Testing workflows configured"
else
    echo "WARNING: No automated testing workflows found (expected for now)"
fi

# Test deployment scripts (placeholder)
echo "Checking deployment scripts..."
if [ -f "deploy.sh" ]; then
    echo "Deployment script found"
    # Test script syntax
    bash -n deploy.sh
    echo "Deployment script syntax valid"
else
    echo "WARNING: No deployment script found"
fi

# Test pipeline triggers
echo "Validating pipeline triggers..."
if grep -q "on:" .github/workflows/ci.yml && \
   grep -q "push:" .github/workflows/ci.yml && \
   grep -q "pull_request:" .github/workflows/ci.yml; then
    echo "Pipeline triggers configured correctly"
else
    echo "ERROR: Pipeline triggers not properly configured"
    exit 1
fi

echo "All CI/CD tests passed!"
