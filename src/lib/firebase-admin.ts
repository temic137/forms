import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseAdminApp: App | null = null;

const getFirebaseAdminApp = () => {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [];
    if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");
    
    console.error(
      `Missing Firebase Admin credentials: ${missingVars.join(", ")}. ` +
      "Please set these environment variables in Vercel."
    );
    throw new Error(
      `Missing Firebase Admin credentials: ${missingVars.join(", ")}`
    );
  }

  // Warn if project IDs don't match (this will cause token verification to fail)
  if (clientProjectId && projectId !== clientProjectId) {
    console.warn(
      `Firebase project ID mismatch: FIREBASE_PROJECT_ID (${projectId}) does not match ` +
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID (${clientProjectId}). This will cause authentication to fail.`
    );
  }

  try {
    firebaseAdminApp =
      getApps().length === 0
        ? initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          })
        : getApps()[0];

    return firebaseAdminApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error(
      `Firebase Admin initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export const firebaseAdminAuth = () => getAuth(getFirebaseAdminApp());




