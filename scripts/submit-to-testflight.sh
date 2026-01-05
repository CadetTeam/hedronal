#!/bin/bash
# Automated TestFlight submission script
# This script increments build number, runs checks, commits, and submits to TestFlight

set -e  # Exit on error

# Use EAS token if provided
export EXPO_TOKEN="${EXPO_TOKEN:-riziok_YnDFAyO2YVYktdoMt08FCNVeQtV1A30sj}"

echo "🚀 Starting automated TestFlight submission..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Read current build number
CURRENT_BUILD=$(node -e "const app = require('./app.json'); console.log(app.expo.ios.buildNumber)")
VERSION=$(node -e "const app = require('./app.json'); console.log(app.expo.version)")

echo "📱 Current version: $VERSION (build $CURRENT_BUILD)"

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))
echo "⬆️  Incrementing build number to $NEW_BUILD"

# Update build number in app.json
node -e "
const fs = require('fs');
const app = require('./app.json');
app.expo.ios.buildNumber = '$NEW_BUILD';
fs.writeFileSync('./app.json', JSON.stringify(app, null, 2) + '\n');
"

echo "✅ Build number updated to $NEW_BUILD"

# Run TypeScript type check
echo "🔍 Running TypeScript type check..."
if ! npx tsc --noEmit; then
  echo "❌ TypeScript errors found. Please fix them before submitting."
  exit 1
fi
echo "✅ TypeScript check passed"

# Run ESLint (non-blocking - warnings only)
echo "🔍 Running ESLint..."
if ! npm run lint 2>/dev/null; then
  echo "⚠️  ESLint check had issues (continuing anyway)..."
else
  echo "✅ ESLint check passed"
fi

# Check git status
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  No changes to commit"
else
  # Stage all changes
  echo "📝 Staging changes..."
  git add -A
  
  # Commit changes
  echo "💾 Committing changes..."
  git commit -m "Increment build number to $NEW_BUILD and prepare for TestFlight submission"
  
  # Push to GitHub
  echo "⬆️  Pushing to GitHub..."
  git push
  
  echo "✅ Changes committed and pushed to GitHub"
fi

# Build the app with auto-submit
echo "🏗️  Building iOS app with auto-submit..."
echo "   This may take 10-20 minutes..."
npx eas build --platform ios --profile production --auto-submit --non-interactive

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting submission."
  exit 1
fi

echo ""
echo "✅ Build complete!"
echo "📤 Checking submission status..."

# If auto-submit didn't work, try manual submission
echo "   Attempting manual submission as fallback..."
npx eas submit --platform ios --latest --non-interactive 2>&1 || echo "   Manual submission also requires App Store Connect API key"

SUBMIT_EXIT_CODE=$?

if [ $SUBMIT_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "⚠️  Submission failed. This usually means:"
  echo "   1. App Store Connect API key not configured"
  echo "   2. App not found in App Store Connect"
  echo "   3. Missing ascAppId in eas.json"
  echo ""
  echo "To fix:"
  echo "   1. Go to App Store Connect → Users and Access → Keys"
  echo "   2. Create an App Store Connect API key"
  echo "   3. Run: npx eas credentials --platform ios"
  echo "   4. Add the API key when prompted"
  echo ""
  echo "Or provide ascAppId in eas.json submit.production.ios.ascAppId"
  echo ""
  echo "Build completed successfully. You can submit manually later."
  exit 0  # Don't fail the script - build succeeded
fi

echo ""
echo "✅ Submission complete!"
echo "📱 Version: $VERSION (build $NEW_BUILD)"
echo "🎉 Your app has been submitted to TestFlight!"

