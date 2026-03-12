# Firebase Data Connect Emulator Start Script
# This script sets up the environment for pglite (PostgreSQL emulator) on Windows

# Set Node.js options for better WebAssembly support on Windows
$env:NODE_OPTIONS = "--no-experimental-fetch"

# Note: The emulator will automatically find an available port if 5432 is in use
# It typically starts on port 5432, but if busy, will use 5433

Write-Host "Starting Firebase Data Connect Emulator..."
Write-Host "If port 5432 is busy, it will automatically use port 5433"

# Run the emulator
firebase emulators:start --only dataconnect

