import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// Your web app's Firebase configuration, now using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom settings
let firestoreDb;
try {
  if (getApps().length === 1) {
    firestoreDb = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (error) {
  // If already initialized, just get the instance
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

export default app;

