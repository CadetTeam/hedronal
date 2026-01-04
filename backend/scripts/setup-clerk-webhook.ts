import dotenv from 'dotenv';

dotenv.config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || process.argv[2];

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY not found in environment variables');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL not provided');
  console.log('Usage: tsx scripts/setup-clerk-webhook.ts <webhook-url>');
  console.log('Example: tsx scripts/setup-clerk-webhook.ts https://your-app.up.railway.app/api/webhooks/clerk');
  process.exit(1);
}

// Clerk API base URL - webhooks are managed per application
// We'll need to get the application ID from the secret key or use the instance endpoint
const CLERK_API_URL = 'https://api.clerk.com/v1';

async function setupWebhook() {
  try {
    console.log('🔍 Checking existing webhooks...');
    
    // List existing webhooks using Clerk REST API
    const listResponse = await fetch(`${CLERK_API_URL}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list webhooks: ${listResponse.statusText}`);
    }

    const webhooks = await listResponse.json();
    console.log(`Found ${webhooks.length} existing webhook(s)`);

    // Check if webhook already exists
    const existingWebhook = webhooks.find(
      (wh: any) => wh.url === WEBHOOK_URL
    );

    const subscriptions = [
      'user.created',
      'user.updated',
      'user.deleted',
      'organization.created',
      'organization.updated',
      'organization.deleted',
      'organizationMembership.created',
      'organizationMembership.updated',
      'organizationMembership.deleted',
    ];

    if (existingWebhook) {
      console.log(`✅ Webhook already exists with ID: ${existingWebhook.id}`);
      console.log('📋 Updating webhook subscriptions...');
      
      // Update webhook with all required events
      const updateResponse = await fetch(`${CLERK_API_URL}/webhooks/${existingWebhook.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          subscriptions,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Failed to update webhook: ${JSON.stringify(error)}`);
      }

      const updated = await updateResponse.json();
      console.log('✅ Webhook updated successfully!');
      console.log(`🔑 Signing Secret: ${updated.signing_secret}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Update Railway environment variable:');
      console.log(`   railway variables --set "CLERK_WEBHOOK_SECRET=${updated.signing_secret}"`);
      return;
    }

    console.log('🚀 Creating new webhook...');

    // Create new webhook
    const createResponse = await fetch(`${CLERK_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        subscriptions,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create webhook: ${JSON.stringify(error)}`);
    }

    const webhook = await createResponse.json();
    console.log('✅ Webhook created successfully!');
    console.log(`📋 Webhook ID: ${webhook.id}`);
    console.log(`🔗 URL: ${webhook.url}`);
    console.log(`🔑 Signing Secret: ${webhook.signing_secret}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Add this to your Railway environment variables:');
    console.log(`   railway variables --set "CLERK_WEBHOOK_SECRET=${webhook.signing_secret}"`);
  } catch (error: any) {
    console.error('❌ Error setting up webhook:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

setupWebhook();

