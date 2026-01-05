#!/bin/bash
# Automated TestFlight submission script
# This script increments build number, runs checks, commits, and submits to TestFlight

set -e  # Exit on error

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

# Run ESLint
echo "🔍 Running ESLint..."
if ! npm run lint; then
  echo "❌ ESLint errors found. Please fix them before submitting."
  exit 1
fi
echo "✅ ESLint check passed"

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

# Build and submit to TestFlight
echo "🏗️  Building and submitting to TestFlight..."
echo "   This may take 10-20 minutes..."
npx eas build --platform ios --profile production --auto-submit

echo ""
echo "✅ Submission complete!"
echo "📱 Version: $VERSION (build $NEW_BUILD)"
echo "🎉 Your app is being submitted to TestFlight!"

