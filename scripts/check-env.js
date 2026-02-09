#!/usr/bin/env node
/**
 * Environment Variables Checker
 * Verifies all required environment variables are set
 */

// Load environment variables from .env file
require('dotenv').config();

const requiredEnvVars = {
  // Firebase Client (Public - safe to expose)
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'Firebase API Key for client-side',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'Firebase Auth Domain',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'Firebase Project ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': 'Firebase Messaging Sender ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'Firebase App ID',
  
  // Firebase Admin (Server-side - must be secret)
  'FIREBASE_PROJECT_ID': 'Firebase Admin Project ID',
  'FIREBASE_CLIENT_EMAIL': 'Firebase Admin Client Email',
  'FIREBASE_PRIVATE_KEY': 'Firebase Admin Private Key',
  
  // Database
  'DATABASE_URL': 'Database connection URL',
  'DIRECT_DATABASE_URL': 'Direct database connection URL',
  
  // Authentication
  'NEXTAUTH_SECRET': 'NextAuth secret key',
  
  // API Keys (Server-side - must be secret)
  'GROQ_API_KEY': 'Groq API Key',
  'RESEND_API_KEY': 'Resend API Key',
  'COHERE_API_KEY': 'Cohere API Key',
  'GOOGLE_AI_API_KEY': 'Google AI API Key',
  
  // Pusher
  'PUSHER_APP_ID': 'Pusher App ID',
  'NEXT_PUBLIC_PUSHER_KEY': 'Pusher Key',
  'PUSHER_SECRET': 'Pusher Secret',
  'NEXT_PUBLIC_PUSHER_CLUSTER': 'Pusher Cluster',
  
  // Google OAuth
  'GOOGLE_CLIENT_ID': 'Google OAuth Client ID',
  'GOOGLE_CLIENT_SECRET': 'Google OAuth Client Secret',
  
  // Cloudinary
  'CLOUDINARY_CLOUD_NAME': 'Cloudinary Cloud Name',
  'CLOUDINARY_API_KEY': 'Cloudinary API Key',
  'CLOUDINARY_API_SECRET': 'Cloudinary API Secret',
};

const optionalEnvVars = {
  'NEXT_PUBLIC_VOICE_INPUT_ENABLED': 'Voice input feature flag',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': 'Firebase Analytics Measurement ID',
};

console.log('🔍 Checking environment variables...\n');

let missingVars = [];
let presentVars = [];

// Check required variables
Object.entries(requiredEnvVars).forEach(([key, description]) => {
  if (!process.env[key]) {
    missingVars.push({ key, description, required: true });
  } else {
    presentVars.push({ key, description, required: true });
  }
});

// Check optional variables
Object.entries(optionalEnvVars).forEach(([key, description]) => {
  if (!process.env[key]) {
    missingVars.push({ key, description, required: false });
  } else {
    presentVars.push({ key, description, required: false });
  }
});

// Display results
console.log(`✅ Found ${presentVars.length} environment variables\n`);

if (missingVars.length > 0) {
  const requiredMissing = missingVars.filter(v => v.required);
  const optionalMissing = missingVars.filter(v => !v.required);
  
  if (requiredMissing.length > 0) {
    console.log('❌ Missing REQUIRED environment variables:\n');
    requiredMissing.forEach(({ key, description }) => {
      console.log(`   ${key}`);
      console.log(`   └─ ${description}\n`);
    });
  }
  
  if (optionalMissing.length > 0) {
    console.log('⚠️  Missing OPTIONAL environment variables:\n');
    optionalMissing.forEach(({ key, description }) => {
      console.log(`   ${key}`);
      console.log(`   └─ ${description}\n`);
    });
  }
  
  if (requiredMissing.length > 0) {
    console.log('\n❌ Please add the missing required variables to your .env file');
    console.log('   Copy .env.example to .env and fill in the values\n');
    process.exit(1);
  }
}

console.log('✅ All required environment variables are set!\n');

// Security check - warn about exposed secrets
const exposedSecrets = [];
Object.keys(requiredEnvVars).forEach(key => {
  if (!key.startsWith('NEXT_PUBLIC_') && process.env[key]) {
    // Check if the value looks like it might be in source code
    const value = process.env[key];
    if (value && value.length > 10) {
      exposedSecrets.push(key);
    }
  }
});

if (exposedSecrets.length > 0) {
  console.log('🔒 Security reminder:');
  console.log('   The following secrets should NEVER be committed to git:');
  exposedSecrets.forEach(key => {
    console.log(`   - ${key}`);
  });
  console.log('   Always use environment variables!\n');
}

console.log('🎉 Environment check passed!\n');
