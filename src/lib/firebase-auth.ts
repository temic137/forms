import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get the ID token to send to your backend for verification
    const idToken = await user.getIdToken();

    return { user, idToken };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Google sign-in failed:", error.message);
      throw error;
    }

    console.error("Google sign-in failed with an unknown error");
    throw error;
  }
};

export const signOutFromFirebase = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Sign out failed:", error.message);
      throw error;
    }

    console.error("Sign out failed with an unknown error");
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
