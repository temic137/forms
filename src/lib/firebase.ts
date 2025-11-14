// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBsbCtRVKXdJozpko4O6JMSqkoocUocHQE",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "forms-9c9d2.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "forms-9c9d2",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "forms-9c9d2.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "453973968485",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:453973968485:web:287a418227ba12cc72e88c",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    "G-9JT1SH5BCZ",
};

// Initialize Firebase (only once)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export auth instance for use throughout the app
export const auth = getAuth(app);

