#!/bin/bash
# Script to configure App Store Connect API key for EAS

set -e

echo "🔑 Setting up App Store Connect API credentials for EAS..."
echo ""

# Check if API key file exists
if [ ! -f "./AuthKey_53BFKP9K77.p8" ]; then
  echo "❌ API key file not found: ./AuthKey_53BFKP9K77.p8"
  echo "   Please ensure the file is in the project root directory"
  exit 1
fi

echo "✅ Found API key file: AuthKey_53BFKP9K77.p8"
echo "📋 Key ID: 53BFKP9K77"
echo ""
echo "To complete setup, you need your Issuer ID from App Store Connect:"
echo "1. Go to: https://appstoreconnect.apple.com/access/api"
echo "2. Your Issuer ID is shown at the top (UUID format, e.g., 12345678-1234-1234-1234-123456789012)"
echo ""
read -p "Enter your Issuer ID: " ISSUER_ID

if [ -z "$ISSUER_ID" ]; then
  echo "❌ Issuer ID is required"
  exit 1
fi

echo ""
echo "🔧 Configuring EAS credentials..."
echo "   This will open an interactive prompt to set up the API key"
echo ""

# Use EAS CLI to configure credentials
# Note: This requires interactive mode, so we'll guide the user
echo "When prompted, provide:"
echo "  - Key ID: 53BFKP9K77"
echo "  - Issuer ID: $ISSUER_ID"
echo "  - Key file path: $(pwd)/AuthKey_53BFKP9K77.p8"
echo ""
echo "Running: npx eas credentials --platform ios"
echo ""

npx eas credentials --platform ios

echo ""
echo "✅ Credentials configuration complete!"
echo "   You can now use 'npm run submit' to automatically submit to TestFlight"

