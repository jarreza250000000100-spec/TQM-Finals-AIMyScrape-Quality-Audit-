import {
  doc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  UserProfile,
  AuditSession,
  Interaction,
  AuditSummary,
  CompanyBasisDoc
} from './types';

// Connection validation per skill requirement
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice. Verify network and configuration.');
    }
    return false;
  }
}

// Sync User Profile to Firestore: users/{userId}
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(profile));
    await setDoc(doc(db, 'users', profile.userId), cleanData, { merge: true });
  } catch (error) {
    console.error('Failed to sync profile to Firestore:', error);
  }
}

// Sync Audit Session: users/{userId}/sessions/{sessionId}
export async function syncSessionToFirestore(session: AuditSession): Promise<void> {
  const path = `users/${session.userId}/sessions/${session.sessionId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(session));
    await setDoc(doc(db, 'users', session.userId, 'sessions', session.sessionId), cleanData, {
      merge: true
    });
  } catch (error) {
    console.error('Failed to sync session to Firestore:', error);
  }
}

// Sync Interaction: users/{userId}/interactions/{interactionId}
export async function syncInteractionToFirestore(interaction: Interaction): Promise<void> {
  const path = `users/${interaction.userId}/interactions/${interaction.interactionId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(interaction));
    await setDoc(
      doc(db, 'users', interaction.userId, 'interactions', interaction.interactionId),
      cleanData
    );
  } catch (error) {
    console.error('Failed to sync interaction to Firestore:', error);
  }
}

// Sync Summary: users/{userId}/summaries/{summaryId}
export async function syncSummaryToFirestore(summary: AuditSummary): Promise<void> {
  const path = `users/${summary.userId}/summaries/${summary.summaryId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(summary));
    await setDoc(
      doc(db, 'users', summary.userId, 'summaries', summary.summaryId),
      cleanData,
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync summary to Firestore:', error);
  }
}

// Sync Company Basis Document: companyBasis/{docId}
export async function syncCompanyBasisToFirestore(docItem: CompanyBasisDoc): Promise<void> {
  const path = `companyBasis/${docItem.docId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(docItem));
    await setDoc(doc(db, 'companyBasis', docItem.docId), cleanData, { merge: true });
  } catch (error) {
    console.error('Failed to sync company basis to Firestore:', error);
  }
}
