#!/usr/bin/env node
/**
 * Firebase Configuration Test
 * Verifies Firebase is properly configured with environment variables
 */

require('dotenv').config();

console.log('🔥 Testing Firebase Configuration...\n');

// Check client-side Firebase config
const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check admin Firebase config
const adminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

let hasErrors = false;

// Validate client config
console.log('📱 Client-side Firebase Configuration:');
Object.entries(clientConfig).forEach(([key, value]) => {
  if (!value) {
    console.log(`   ❌ NEXT_PUBLIC_${key.toUpperCase()} is missing`);
    hasErrors = true;
  } else {
    console.log(`   ✅ NEXT_PUBLIC_${key.toUpperCase()} is set`);
  }
});

console.log('\n🔐 Server-side Firebase Admin Configuration:');
Object.entries(adminConfig).forEach(([key, value]) => {
  if (!value) {
    console.log(`   ❌ FIREBASE_${key.toUpperCase()} is missing`);
    hasErrors = true;
  } else {
    // Don't show actual values for security
    const displayValue = key === 'privateKey' 
      ? '(Private key set)' 
      : value.substring(0, 20) + '...';
    console.log(`   ✅ FIREBASE_${key.toUpperCase()} is set: ${displayValue}`);
  }
});

// Check if project IDs match
console.log('\n🔍 Configuration Validation:');
if (clientConfig.projectId !== adminConfig.projectId) {
  console.log('   ⚠️  WARNING: Client and Admin project IDs do not match!');
  console.log(`      Client: ${clientConfig.projectId}`);
  console.log(`      Admin:  ${adminConfig.projectId}`);
  console.log('      This will cause authentication to fail!');
  hasErrors = true;
} else {
  console.log('   ✅ Project IDs match');
}

// Check API key format
if (clientConfig.apiKey && !clientConfig.apiKey.startsWith('AIzaSy')) {
  console.log('   ⚠️  WARNING: API key format looks incorrect');
  hasErrors = true;
} else if (clientConfig.apiKey) {
  console.log('   ✅ API key format is valid');
}

// Check private key format
if (adminConfig.privateKey && !adminConfig.privateKey.includes('BEGIN PRIVATE KEY')) {
  console.log('   ⚠️  WARNING: Private key format looks incorrect');
  console.log('      Make sure it includes the full key with headers');
  hasErrors = true;
} else if (adminConfig.privateKey) {
  console.log('   ✅ Private key format is valid');
}

// Check for hardcoded values (security check)
console.log('\n🔒 Security Check:');
const fs = require('fs');
const path = require('path');

const firebaseFile = path.join(process.cwd(), 'src/lib/firebase.ts');
if (fs.existsSync(firebaseFile)) {
  const content = fs.readFileSync(firebaseFile, 'utf8');
  
  if (content.includes('AIzaSy')) {
    console.log('   ❌ SECURITY ISSUE: Hardcoded API key found in firebase.ts!');
    hasErrors = true;
  } else {
    console.log('   ✅ No hardcoded API keys in firebase.ts');
  }
  
  if (content.includes('||') && content.includes('process.env')) {
    console.log('   ⚠️  WARNING: Fallback values detected in firebase.ts');
    console.log('      Consider removing fallback values for better security');
  } else {
    console.log('   ✅ No fallback values (environment variables only)');
  }
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Firebase configuration has issues!');
  console.log('   Please fix the issues above before deploying.\n');
  process.exit(1);
} else {
  console.log('✅ Firebase configuration is valid!');
  console.log('   Your app is ready to use Firebase.\n');
}
