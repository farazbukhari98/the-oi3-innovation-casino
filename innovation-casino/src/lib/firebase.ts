import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

console.log('[Firebase] Initializing with config:', {
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Validate critical configuration
if (!firebaseConfig.databaseURL) {
  console.error('[Firebase] CRITICAL: Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL');
}
if (!firebaseConfig.apiKey) {
  console.error('[Firebase] CRITICAL: Missing NEXT_PUBLIC_FIREBASE_API_KEY');
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

console.log('[Firebase] Database initialized successfully');

// Monitor Firebase connection state
if (typeof window !== 'undefined') {
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    const connected = snapshot.val();
    if (connected) {
      console.log('[Firebase] ✅ Connected to Realtime Database');
    } else {
      console.warn('[Firebase] ❌ Disconnected from Realtime Database');
    }
  });
}

export { app, database };
