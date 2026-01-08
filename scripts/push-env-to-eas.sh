#!/bin/bash
# Push all environment variables to EAS
# This script sets up all required environment variables in EAS for the project

set -e

EXPO_TOKEN="${EXPO_TOKEN:-riziok_YnDFAyO2YVYktdoMt08FCNVeQtV1A30sj}"
PROJECT_ID="4b4fa0f9-aee0-453e-a485-11691a4b68d7"

echo "🚀 Pushing environment variables to EAS..."
echo "📱 Project ID: $PROJECT_ID"
echo ""

# Export token for EAS CLI
export EXPO_TOKEN

# Get Clerk publishable key from app.json
CLERK_KEY=$(node -e "const app = require('./app.json'); console.log(app.expo.extra.clerkPublishableKey)")
echo "📝 Found Clerk key in app.json: ${CLERK_KEY:0:20}..."

# Set Clerk publishable key (for all environments)
echo "Setting EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY..."
for env in production preview development; do
  npx eas env:create "$env" --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "$CLERK_KEY" --type string --visibility plaintext --non-interactive --force 2>&1 | grep -v "already exists" && echo "✅ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY set for $env" || echo "⚠️  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY already exists for $env"
done

# Set API URL (Railway production) - for all environments
API_URL="https://hedronal-production.up.railway.app/api"
echo "Setting EXPO_PUBLIC_API_URL..."
for env in production preview development; do
  npx eas env:create "$env" --scope project --name EXPO_PUBLIC_API_URL --value "$API_URL" --type string --visibility plaintext --non-interactive --force 2>&1 | grep -v "already exists" && echo "✅ EXPO_PUBLIC_API_URL set for $env" || echo "⚠️  EXPO_PUBLIC_API_URL already exists for $env"
done

echo ""
echo "⚠️  The following variables need to be set manually (they contain sensitive values):"
echo ""
echo "   npx eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value 'your-supabase-url'"
echo "   npx eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_KEY --value 'your-supabase-anon-key'"
echo ""
echo "Or set them via the EAS dashboard:"
echo "   https://expo.dev/accounts/hedronal/projects/hedronal/secrets"
echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "To view all environment variables:"
echo "   npx eas env:list"

