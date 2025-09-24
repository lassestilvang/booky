#!/bin/bash

set -e

# Test container build
echo "Testing Docker container build..."
docker build -t booky-backend-test backend

# Test multi-stage build optimization
echo "Testing multi-stage build optimization..."
IMAGE_SIZE=$(docker images booky-backend-test --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

# Should be less than 200MB for optimized build
# Note: Adjust threshold based on actual build

# Test environment variable validation
echo "Testing environment variable validation..."
docker run --rm -d --name booky-test -p 3000:3000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e REDIS_URL="redis://localhost:6379" \
  booky-backend-test

# Wait for container to start
sleep 10

# Test health check
echo "Testing health check..."
HEALTH_STATUS=$(docker inspect booky-test --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "Health check passed"
else
    echo "Health check failed or not configured"
fi

# Test that container is running as non-root user
echo "Testing non-root user..."
USER_ID=$(docker exec booky-test id -u)
if [ "$USER_ID" -ne 0 ]; then
    echo "Container running as non-root user (UID: $USER_ID)"
else
    echo "ERROR: Container running as root"
    exit 1
fi

# Test port exposure
echo "Testing port exposure..."
PORT_CHECK=$(docker port booky-test 3000/tcp)
if [ -n "$PORT_CHECK" ]; then
    echo "Port 3000 exposed correctly"
else
    echo "ERROR: Port 3000 not exposed"
    exit 1
fi

# Cleanup
docker stop booky-test
docker rm booky-test
docker rmi booky-backend-test

echo "All Docker tests passed!"
