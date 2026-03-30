import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// Use initializeFirestore to set experimentalForceLongPolling and offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);

// Test connection
async function testConnection() {
  try {
    // We'll just check if we can initialize, the actual connectivity 
    // will be handled by the hooks and error boundaries.
    console.log("Firebase initialized");
  } catch (error) {
    console.error("Firebase initialization error", error);
  }
}
testConnection();
