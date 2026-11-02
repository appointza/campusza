#!/bin/bash
# Production Build Script for Campusza
# This script builds and publishes the application for production deployment

echo "========================================"
echo "Campusza Production Build Script"
echo "========================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_PATH="$SCRIPT_DIR/Campusza/Campusza.csproj"
PUBLISH_PATH="$SCRIPT_DIR/publish"

# Clean previous publish
if [ -d "$PUBLISH_PATH" ]; then
    echo "Cleaning previous publish folder..."
    rm -rf "$PUBLISH_PATH"
fi

# Restore packages
echo "Restoring NuGet packages..."
dotnet restore "$PROJECT_PATH"
if [ $? -ne 0 ]; then
    echo "Package restore failed!"
    exit 1
fi

# Build in Release mode
echo ""
echo "Building project in Release mode..."
dotnet build "$PROJECT_PATH" -c Release --no-restore
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Publish for production
echo ""
echo "Publishing application for production..."
dotnet publish "$PROJECT_PATH" -c Release -o "$PUBLISH_PATH" --no-build --self-contained false
if [ $? -ne 0 ]; then
    echo "Publish failed!"
    exit 1
fi

# Display publish information
echo ""
echo "========================================"
echo "Build completed successfully!"
echo "========================================"
echo ""
echo "Publish location: $PUBLISH_PATH"
echo ""
echo "Next steps:"
echo "1. Review the published files in the 'publish' folder"
echo "2. Ensure appsettings.json has production configuration"
echo "3. Deploy the contents of the 'publish' folder to your server"
echo "4. Make sure .NET 6.0 Runtime is installed on the target server"
echo ""

