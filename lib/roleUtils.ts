import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Checks if the given user has the "Dennis" role.
 * Returns the system data if authorized, throws otherwise.
 */
export async function verifyDennisRole(userId: string): Promise<{ authorized: true; systemData: Record<string, any> }> {
    const db = getFirestore(adminApp);
    const systemRef = db.doc(`users/${userId}/private/system`);
    const systemDoc = await systemRef.get();

    if (!systemDoc.exists) {
        throw new Error('User system data not found');
    }

    const systemData = systemDoc.data();
    if (systemData?.role !== 'Dennis') {
        throw new Error('Access denied: Dennis role required');
    }

    return { authorized: true, systemData: systemData! };
}

/**
 * Returns true if the user has the "Dennis" role, false otherwise.
 * Does not throw — safe for client-side pre-checks.
 */
export async function hasDennisRole(userId: string): Promise<boolean> {
    try {
        await verifyDennisRole(userId);
        return true;
    } catch {
        return false;
    }
}
