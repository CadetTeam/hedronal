#!/bin/bash
# Configure App Store Connect API key for EAS

set -e

KEY_ID="53BFKP9K77"
ISSUER_ID="69a6de96-458d-47e3-e053-5b8c7c11a4d1"
KEY_FILE="./AuthKey_53BFKP9K77.p8"

echo "🔑 Configuring App Store Connect API key for EAS..."
echo ""
echo "Key ID: $KEY_ID"
echo "Issuer ID: $ISSUER_ID"
echo "Key file: $KEY_FILE"
echo ""

if [ ! -f "$KEY_FILE" ]; then
  echo "❌ API key file not found: $KEY_FILE"
  exit 1
fi

echo "✅ API key file found"
echo ""
echo "Running EAS credentials configuration..."
echo "When prompted, select 'Set up App Store Connect API key'"
echo ""

# EAS credentials command requires interactive mode
# We'll guide the user through it
npx eas credentials --platform ios

echo ""
echo "✅ Configuration complete!"
echo "   Automatic TestFlight submission should now work"

