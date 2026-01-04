Hedronal

A React Native mobile application built with Expo SDK 54, featuring authentication, dark/light mode support with earthy tones, and demo mode functionality.

OVERVIEW

Hedronal is a full-stack mobile application with a React Native frontend, Node.js backend API, Supabase database, and Clerk authentication. The app supports entity management, user profiles, organizations, and real-time synchronization between Clerk and Supabase.

FEATURES

Expo SDK 54 with TypeScript
Authentication screens (Login, Register, Forgot Password) using Clerk
Dark/Light mode with earthy tone theme
Demo mode (activate by long-pressing logo for 6 seconds on auth screen)
Skeleton components, loading states, and empty states
Backend API server with Node.js and Express
Safe area management
Navigation setup with React Navigation
Supabase database integration
Clerk webhook synchronization
Railway automatic deployment

PROJECT STRUCTURE

Hedronal/
├── src/
│   ├── components/          Reusable UI components
│   ├── screens/             Screen components
│   │   └── auth/           Authentication screens
│   ├── navigation/          Navigation configuration
│   ├── services/           API services
│   ├── context/            React Context providers
│   ├── constants/          Constants and theme
│   ├── types/              TypeScript types
│   └── utils/              Utility functions
├── backend/                Node.js backend server
│   └── src/
│       ├── routes/         API routes
│       ├── controllers/    Route controllers
│       ├── middleware/     Express middleware
│       └── config/         Configuration files
├── supabase/              Supabase schema and setup
└── assets/                Images and static assets

PREREQUISITES

Node.js 20.19.x or higher
npm or yarn
Expo CLI (optional, can use npx)
Apple Developer Account (for iOS deployment)
Supabase account
Clerk account
Railway account (for backend deployment)
GitHub account (for automatic deployments)

INSTALLATION

Frontend Dependencies

Navigate to the project root and install dependencies:

npm install

Backend Dependencies

Navigate to the backend directory and install dependencies:

cd backend
npm install

LOCAL DEVELOPMENT SETUP

Environment Variables

Create a .env file in the project root for local development:

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_APP_ID=your-clerk-app-id
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id

Backend Environment Variables

Create a backend/.env file:

PORT=3000
NODE_ENV=development
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

RUNNING THE APPLICATION

Frontend Mobile App

Start the Expo development server:

npm start

Then:
Press i for iOS simulator
Press a for Android emulator
Scan QR code with Expo Go app on your device

Backend API Server

Start the backend server in development mode:

cd backend
npm run dev

The backend will run on http://localhost:3000 by default.

Production Build

Build the backend for production:

cd backend
npm run build
npm start

DEMO MODE

To enable demo mode:
1. Navigate to the Login screen
2. Long-press the Hedronal logo (H) for 6 seconds
3. Demo mode will be activated and persisted

THEME

The app uses an earthy tone color palette with full dark/light mode support. The theme automatically adapts to the system theme, but can be manually toggled.

BACKEND API ENDPOINTS

Authentication Endpoints

POST /api/auth/register - Register a new user
Body: { email: string, password: string, name: string }

POST /api/auth/login - Login user
Body: { email: string, password: string }

POST /api/auth/forgot-password - Request password reset
Body: { email: string }

POST /api/auth/reset-password - Reset password
Body: { token: string, password: string }

GET /api/auth/me - Get current user (requires Authorization header)
Headers: Authorization: Bearer <token>

Entity Endpoints

POST /api/entities - Create a new entity (requires auth)
GET /api/entities - List entities (requires auth)
GET /api/entities/:id - Get entity by ID
GET /api/entities/clerk/:clerkOrgId - Get entity by Clerk organization ID
PATCH /api/entities/:id - Update entity (requires auth)

Webhook Endpoints

POST /api/webhooks/clerk - Clerk webhook endpoint for user and organization sync

Health Check

GET /health - Health check endpoint
Returns: {"status":"ok","message":"Hedronal API is running"}

SUPABASE SETUP

Deploy Database Schema

1. Go to Supabase Dashboard at https://supabase.com/dashboard
2. Select your Hedronal project
3. Navigate to SQL Editor
4. Copy the contents of supabase/schema-clerk.sql
5. Paste and run the SQL script
6. Verify all tables are created in the Table Editor

Create Storage Buckets

1. In Supabase Dashboard, go to SQL Editor again
2. Copy and run the contents of supabase/setup-storage.sql
3. Verify buckets are created in Storage section:
   avatars (public)
   banners (public)
   documents (private)
   posts (public)

Storage Bucket Configuration

For each bucket, set the appropriate policies:
Public buckets (avatars, banners, posts): Allow public read access
Private buckets (documents): Only allow authenticated users to read/write

Row Level Security

The schema includes RLS policies. Review and adjust them based on your specific requirements in the Supabase Dashboard under Authentication > Policies.

Initial Data

Run this SQL to insert initial article topics:

INSERT INTO article_topics (name, description) VALUES
  ('Private Equity', 'Private equity fund structures and investments'),
  ('Family Offices', 'Family office management and structures'),
  ('Non-Profits', 'Non-profit organization management'),
  ('Tax Mitigation', 'Tax planning and mitigation strategies'),
  ('Acquisitions', 'M&A and acquisition strategies'),
  ('Fund Formations', 'Fund formation and structuring'),
  ('SPVs', 'Special Purpose Vehicle structures'),
  ('Trusts', 'Trust structures and management'),
  ('Donor Advised Funds', 'DAF management and strategies'),
  ('Estate Planning', 'Estate planning and wealth transfer');

CLERK AUTHENTICATION SETUP

Configure Clerk Application

1. Create a new Clerk application at https://dashboard.clerk.com
2. Copy your Publishable Key from the Clerk dashboard
3. Add it to your environment variables or app.json

Environment Configuration

Option A: Using .env file (recommended for development)

Create a .env file in the root directory with:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

Option B: Using app.json

Add to app.json under extra:
{
  "expo": {
    "extra": {
      "clerkPublishableKey": "pk_test_..."
    }
  }
}

CLERK WEBHOOK SETUP

Since Clerk webhooks must be configured through the dashboard, follow these steps:

Step 1: Access Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Sign in to your account
3. Select your Hedronal application

Step 2: Create Webhook

1. In the sidebar, click Webhooks
2. Click Add Endpoint or Create Webhook
3. Enter the following:

Endpoint URL:
https://hedronal-production.up.railway.app/api/webhooks/clerk

Subscribe to Events:
user.created
user.updated
user.deleted
organization.created
organization.updated
organization.deleted
organizationMembership.created
organizationMembership.updated
organizationMembership.deleted

4. Click Create or Save

Step 3: Get Webhook Secret

1. After creating the webhook, you'll see a Signing Secret
2. It will look like: whsec_...
3. Copy this secret

Step 4: Add Secret to Railway

Run this command (replace with your actual secret):

cd backend
railway link
railway variables --set "CLERK_WEBHOOK_SECRET=whsec_your-actual-secret-here"

Step 5: Verify Setup

1. Test the webhook by creating a test user in Clerk
2. Check your Railway logs to see if webhook events are received
3. Check Supabase to verify profiles are being created

RAILWAY DEPLOYMENT

Railway automatically deploys the backend when you push to GitHub. The backend uses Railpack as the build system.

Prerequisites

Railway account (sign up at https://railway.app)
GitHub repository connected
Backend code ready to deploy

Step 1: Create Railway Project

1. Go to Railway Dashboard at https://railway.app/dashboard
2. Click New Project
3. Select Deploy from GitHub repo
4. Authorize Railway to access your GitHub account
5. Select the hedronal repository
6. Railway will detect it's a Node.js project

Step 2: Configure Service

Set Root Directory

Since the backend is in a subdirectory:

1. In Railway project, click on the service
2. Go to Settings tab
3. Under Source, set Root Directory to: backend
4. Save changes

Configure Build Settings

Railway will auto-detect the build, but you can verify:

1. Go to Settings → Build
2. Build Command: npm install && npm run build
3. Start Command: npm start
4. Output Directory: dist (optional, Railway handles this)

The railway.json file specifies Railpack as the builder:

{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}

Step 3: Set Environment Variables

In Railway service, go to Variables tab and add:

PORT=3000
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

Important:
Get SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API
Get CLERK_WEBHOOK_SECRET from Clerk Dashboard → Webhooks (after creating webhook)

Quick Setup Script

You can use the provided script to push all variables:

cd backend
railway link
./push-vars.sh

Or set variables individually:

railway variables --set "PORT=3000"
railway variables --set "NODE_ENV=production"
railway variables --set "SUPABASE_URL=your-supabase-url"
railway variables --set "SUPABASE_ANON_KEY=your-supabase-anon-key"
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
railway variables --set "CLERK_SECRET_KEY=your-clerk-secret-key"
railway variables --set "CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret"

Step 4: Configure Auto-Deploy

1. Go to Settings → Source
2. Enable Auto Deploy (should be enabled by default)
3. Select branch: main or master (your default branch)
4. Railway will now deploy automatically on every push

Step 5: Update Clerk Webhook URL

1. Get your Railway deployment URL:
   Go to Railway service → Settings → Networking
   Copy the generated domain (e.g., your-app.up.railway.app)

2. Update Clerk webhook:
   Go to Clerk Dashboard → Webhooks
   Update endpoint URL to: https://your-app.up.railway.app/api/webhooks/clerk
   Save changes

Step 6: Test Deployment

1. Make a small change to the backend code
2. Commit and push to GitHub:
   git add .
   git commit -m "Test Railway deployment"
   git push origin main

3. Watch Railway deploy:
   Go to Railway Dashboard
   Click on your service
   Watch the Deployments tab for build progress

4. Check logs:
   Go to Logs tab to see deployment and runtime logs

Step 7: Get Production URL

1. In Railway service, go to Settings → Networking
2. Railway provides a default domain (e.g., your-app.up.railway.app)
3. Or add a custom domain:
   Click Generate Domain for a Railway domain
   Or add your own custom domain

Step 8: Update Frontend API URL

Update your frontend to use the Railway URL:

Update src/services/api.ts:
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-app.up.railway.app/api';

Update src/services/entityService.ts:
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-app.up.railway.app/api';

EAS DEPLOYMENT

The frontend is configured for EAS (Expo Application Services) builds and deployments.

EAS Project Configuration

Project ID: your-eas-project-id
Organization: responsenow
Project Slug: hedronal

Environment Variables in EAS

All environment variables are configured in EAS for production, preview, and development environments:

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (plaintext)
CLERK_SECRET_KEY (secret)
EXPO_PUBLIC_SUPABASE_URL (plaintext)
EXPO_PUBLIC_SUPABASE_KEY (plaintext)

Building with EAS

Build for iOS:
eas build --platform ios

Build for Android:
eas build --platform android

APP STORE SUBMISSION

Prerequisites

Apple Developer Account (enrolled in Apple Developer Program - $99/year)
Xcode (latest version from Mac App Store)
Clerk Production Keys (switch from test to production)
Supabase Production Environment

Step 1: Configure Production Settings

Update app.json for Production

Make sure your app.json has production-ready settings:

{
  "expo": {
    "name": "Hedronal",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.responsenow.Hedronal",
      "buildNumber": "1",
      "supportsTablet": true
    }
  }
}

Set Up Environment Variables

Create a .env.production file:

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key (production key)
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-key

Step 2: Build the iOS App

Prebuild Native Projects

cd /Users/coreyengel/git/Hedronal
npx expo prebuild --platform ios --clean

This generates the native iOS project in the ios/ folder.

Open in Xcode

open ios/Hedronal.xcworkspace

Important: Always open the .xcworkspace file, NOT the .xcodeproj file.

Step 3: Configure Team ID in Xcode

Select Your Project

1. In Xcode, click on Hedronal (blue icon) in the left sidebar (Project Navigator)
2. Select the Hedronal project (not the target) in the main editor
3. Click on the Hedronal target under TARGETS

Set Up Signing & Capabilities

1. Click on the Signing & Capabilities tab
2. Check Automatically manage signing
3. In the Team dropdown:
   If you see your team name, select it
   If you see Add an Account..., click it and sign in with your Apple ID
   Your Team ID will appear automatically once selected

Verify Bundle Identifier

1. Make sure the Bundle Identifier is: com.responsenow.Hedronal
2. Xcode will automatically create an App ID in your Apple Developer account if it doesn't exist

Update app.json with Team ID

Once you see your Team ID in Xcode (it's a 10-character string like ABC123DEFG):

1. Copy the Team ID from Xcode
2. Update app.json:
   "ios": {
     "appleTeamId": "YOUR_ACTUAL_TEAM_ID"
   }

Step 4: Configure App Store Connect

Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click My Apps → + → New App
3. Fill in:
   Platform: iOS
   Name: Hedronal
   Primary Language: English
   Bundle ID: Select com.responsenow.Hedronal (or create it if needed)
   SKU: A unique identifier (e.g., hedronal-001)
   User Access: Full Access

App Information

Fill in:
Category: Business (or appropriate category)
Privacy Policy URL: (required) Your privacy policy URL
Support URL: Your support website
Marketing URL: (optional) Your marketing website

Step 5: Build for App Store

Update Version and Build Number

In Xcode:
1. Select the Hedronal target
2. Go to General tab
3. Set:
   Version: 1.0.0 (or your version)
   Build: 1 (increment for each submission)

Or update in app.json:
"ios": {
  "buildNumber": "1",
  "version": "1.0.0"
}

Configure Build Settings

1. In Xcode, select Hedronal target
2. Go to Build Settings tab
3. Search for Code Signing Identity
4. Set to Apple Distribution for Release builds

Archive the App

1. In Xcode menu: Product → Scheme → Hedronal
2. Select Any iOS Device (not a simulator) from the device dropdown
3. Go to Product → Archive
4. Wait for the archive to complete (this may take several minutes)

Upload to App Store Connect

1. After archiving, the Organizer window will open
2. Select your archive
3. Click Distribute App
4. Select App Store Connect
5. Click Next
6. Select Upload (not Export)
7. Follow the prompts:
   Select your distribution certificate
   Select your provisioning profile
   Review the app information
   Click Upload

Step 6: Submit for Review

Complete App Store Listing

In App Store Connect:

1. App Information:
   App name, subtitle, category
   Privacy policy URL (required)

2. Pricing and Availability:
   Set price (Free or Paid)
   Select countries/regions

3. App Privacy:
   Complete privacy questionnaire
   Declare data collection practices

4. Version Information:
   Screenshots: Required sizes:
     6.7" iPhone (1290 x 2796 pixels) - iPhone 14 Pro Max
     6.5" iPhone (1242 x 2688 pixels) - iPhone 11 Pro Max
     5.5" iPhone (1242 x 2208 pixels) - iPhone 8 Plus
   App Preview: (optional) Video preview
   Description: App description
   Keywords: Search keywords (100 characters max)
   Support URL: Required
   Marketing URL: (optional)
   Promotional Text: (optional) Can be updated without review
   What's New: Release notes for this version

5. Build:
   Select the build you uploaded
   Wait for processing (can take 10-60 minutes)

6. App Review Information:
   Contact information
   Demo account (if needed)
   Notes for reviewer

Submit for Review

1. Click Add for Review or Submit for Review
2. Answer export compliance questions
3. Confirm submission

Step 7: Monitor Submission

1. Check App Store Connect for status updates
2. You'll receive email notifications about:
   Processing complete
   In Review
   Ready for Sale (approved)
   Rejected (with feedback)

DEVELOPMENT

Code Style

TypeScript strict mode
Functional components with hooks
Named exports preferred
Follow Expo and React Native best practices
ESLint and Prettier configured

Adding New Features

1. Create components in src/components/
2. Create screens in src/screens/
3. Add types in src/types/
4. Add API services in src/services/
5. Update navigation in src/navigation/

Building for Production

iOS

npm run ios

Android

npm run android

ENVIRONMENT VARIABLES SUMMARY

Backend Environment Variables (.env)

PORT=3000
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

Frontend Environment Variables (EAS Secrets)

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_KEY

Variable Priority Order

1. Environment variables (.env file or system env)
2. app.json extra (fallback)
3. EAS secrets (for builds only)

TROUBLESHOOTING

Webhook Not Working

Verify webhook URL is accessible
Check webhook secret matches in backend .env
Check backend logs for webhook errors
Verify Clerk webhook events are subscribed

Entities Not Creating

Check backend logs for errors
Verify Clerk token is being sent from frontend
Check Supabase RLS policies allow inserts
Verify profile exists for the user

Storage Upload Failing

Verify storage buckets are created
Check storage policies allow uploads
Verify file size is within limits
Check MIME type is allowed

Build Fails

Check Railway logs for errors
Verify package.json has correct build script
Ensure TypeScript compiles without errors locally first

Service Won't Start

Check environment variables are set correctly
Verify PORT environment variable (Railway sets this automatically)
Check logs for runtime errors

Database Connection Issues

Verify Supabase URL and keys are correct
Check Supabase allows connections from Railway IPs
Ensure service role key is used (not anon key)

Clerk Not Working

Verify CLERK_PUBLISHABLE_KEY is set correctly
Check that Clerk app is configured for mobile
Ensure you're using the correct environment (development vs production)

Supabase Connection Issues

Verify Supabase URL and keys are correct
Check that RLS policies allow your operations
Ensure tables are created from schema.sql

Entity Creation Fails

Verify user is authenticated
Check Clerk organization creation permissions
Ensure Supabase tables exist and are accessible

App Store Submission Issues

No accounts with App Store Connect access:
Make sure you're enrolled in Apple Developer Program
Check that your Apple ID has the correct role in App Store Connect

Bundle identifier is already in use:
The bundle ID must be unique across all App Store apps
Change it in app.json and Xcode if needed

Missing compliance:
Answer the export compliance questions in App Store Connect
If using encryption, you may need to provide documentation

Invalid provisioning profile:
In Xcode: Preferences → Accounts → Select your account → Download Manual Profiles
Or enable Automatically manage signing in Signing & Capabilities

VERIFICATION CHECKLIST

After setup, verify:

1. All tables are created (check in Supabase Table Editor)
2. All storage buckets exist (check in Supabase Storage)
3. RLS policies are enabled (check in Supabase Authentication > Policies)
4. Indexes are created (check in Supabase Database > Indexes)
5. Clerk webhook is configured and receiving events
6. Railway deployment is working and service is running
7. Health endpoint responds: curl https://your-app.up.railway.app/health
8. Frontend can connect to backend API
9. User creation syncs between Clerk and Supabase
10. Organization creation syncs between Clerk and Supabase

MONITORING

Railway Monitoring

Logs: Real-time logs in Railway Dashboard
Metrics: CPU, Memory, Network usage
Deployments: History of all deployments

App Store Connect Monitoring

Analytics: Use App Store Connect analytics
Reviews: Engage with user feedback
Updates: Keep the app updated with new features

NEXT STEPS

Set up CI/CD for backend
Configure production database backups
Set up monitoring and error tracking
Configure CDN for storage buckets
Set up staging environment
Respond to App Store reviews
Monitor analytics and user feedback
Keep the app updated with new features

RESOURCES

App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
App Store Connect Help: https://help.apple.com/app-store-connect/
Expo App Store Submission: https://docs.expo.dev/submit/ios/
Railway Documentation: https://docs.railway.app
Clerk Documentation: https://clerk.com/docs
Supabase Documentation: https://supabase.com/docs

LICENSE

Private project
