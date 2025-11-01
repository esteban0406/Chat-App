#!/bin/bash
echo "🧹 Cleaning up test-related temporary files and caches..."

# Remove MongoDB Memory Server cache
if [ -d "$HOME/.cache/mongodb-binaries" ]; then
  echo "🗑️ Removing MongoDB memory server binaries..."
  rm -rf "$HOME/.cache/mongodb-binaries"
fi

# Remove tmp test databases
echo "🗑️ Removing temporary MongoDB data from /tmp..."
rm -rf /tmp/mongodb-memory-server-* 2>/dev/null

# Remove Jest coverage and cache
echo "🗑️ Removing Jest cache and coverage..."
rm -rf coverage
rm -rf node_modules/.cache/jest

# Clean npm cache and logs
echo "🗑️ Cleaning npm cache and logs..."
npm cache clean --force
rm -rf "$HOME/.npm/_logs"

# Optional: prune unused Docker data (only if you use Docker)
if command -v docker &> /dev/null; then
  echo "🐳 Cleaning unused Docker data..."
  docker system prune -af --volumes
fi

echo "✅ Cleanup complete! Disk space reclaimed successfully."
