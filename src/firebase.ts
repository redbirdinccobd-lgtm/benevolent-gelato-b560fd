import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { initializeFirestore, getDocFromServer, doc, setLogLevel } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Singleton instances
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: any | undefined;
let analytics: Analytics | null = null;

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Suppress Firestore internal connection retry logs in browser console
    setLogLevel('silent');

    // Respect the named database if it's provided
    // Use auto-detected long-polling for seamless fallback in iframes and sandboxes
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    
    // Test connection on boot as per instructions
    const testConnection = async () => {
      try {
        if (db) {
          await getDocFromServer(doc(db, 'test', 'connection'));
        }
      } catch (error) {
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
          // Client operates in offline mode with cached data until connection stabilizes
        }
      }
    };
    testConnection();

    if (typeof window !== 'undefined' && firebaseConfig.measurementId && firebaseConfig.measurementId.trim() !== '') {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Analytics unsupported in current environment
      });
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase configuration is missing or invalid. Firebase features will be disabled.");
}

export { app, auth, db, analytics };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  const isOfflineOrUnavailable = 
    errCode === 'unavailable' || 
    errMessage.includes('unavailable') || 
    errMessage.includes('offline');

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineOrUnavailable) {
    console.warn('Firestore temporary network unavailable/offline mode:', JSON.stringify(errInfo));
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
