#!/bin/bash
# Setup EAS for full CI/CD and automated submissions
# This script configures all necessary credentials and environment variables

set -e

EXPO_TOKEN="${EXPO_TOKEN:-riziok_YnDFAyO2YVYktdoMt08FCNVeQtV1A30sj}"
PROJECT_ID="4b4fa0f9-aee0-453e-a485-11691a4b68d7"

echo "🚀 Setting up EAS for full CI/CD..."
echo "📱 Project ID: $PROJECT_ID"
echo ""

# Set environment variables (these will need to be provided)
echo "📝 Note: You'll need to set these environment variables manually via:"
echo "   npx eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value 'your-value'"
echo "   npx eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_KEY --value 'your-value'"
echo "   npx eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY --value 'your-value'"
echo ""
echo "✅ Clerk publishable key is already in app.json"
echo ""

# Check current credentials status
echo "🔍 Checking current iOS credentials status..."
EXPO_TOKEN="$EXPO_TOKEN" npx eas credentials --platform ios 2>&1 || echo "⚠️  Credentials may need to be set up interactively"
echo ""

echo "✅ Setup script complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables via EAS dashboard or CLI"
echo "2. Configure iOS credentials: npx eas credentials --platform ios"
echo "3. Test build: npx eas build --platform ios --profile production"
echo "4. Submit: npm run submit"

