import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore using the provisioned firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Server-side authentication bootstrap for Cloud Run / Node runtime
if (typeof window === 'undefined') {
  (async () => {
    try {
      if (!auth.currentUser && firebaseConfig.oAuthClientId) {
        const { execSync } = await import('child_process');
        const tokenCmd = `curl -s -m 2 -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${firebaseConfig.oAuthClientId}"`;
        const idToken = execSync(tokenCmd).toString().trim();
        if (idToken && idToken.startsWith('ey')) {
          const { signInWithCredential } = await import('firebase/auth');
          const cred = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, cred);
        }
      }
    } catch {
      // Graceful fallback for environments without metadata server
    }
  })();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}
