import { useState, useCallback } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface PromoCode {
    code: string;
    tokenAmount: number;
    description: string;
    createdAt: string;
    createdBy: string;
    expiresAt: string;
    isUsed: boolean;
    usedBy: string | null;
    usedAt: string | null;
}

interface PromoCodeFormValues {
    tokenAmount: number;
    description: string;
    expirationDays: number;
}

interface UsePromoCodeManagementReturn {
    promoCodes: PromoCode[];
    loading: boolean;
    error: string | null;
    fetchPromoCodes: () => Promise<void>;
    createPromoCode: (values: PromoCodeFormValues) => Promise<{ success: boolean; promoCode?: string; error?: string }>;
    deletePromoCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

// Function to generate a random promo code
function generatePromoCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

export function usePromoCodeManagement(): UsePromoCodeManagementReturn {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all promo codes
    const fetchPromoCodes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const db = getFirestore(app);
            const promoCodesRef = collection(db, 'promo-codes');
            const q = query(promoCodesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const codes: PromoCode[] = [];
            querySnapshot.forEach((doc) => {
                codes.push({
                    code: doc.id,
                    ...doc.data()
                } as PromoCode);
            });

            setPromoCodes(codes);
        } catch (err: any) {
            console.error('Error fetching promo codes:', err);
            setError('Failed to load promo codes');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new promo code directly in Firestore
    const createPromoCode = useCallback(async (values: PromoCodeFormValues) => {
        try {
            const { tokenAmount, description, expirationDays } = values;
            
            // Validate token amount
            if (typeof tokenAmount !== 'number' || tokenAmount <= 0 || tokenAmount > 10000) {
                return { 
                    success: false, 
                    error: "Invalid token amount. Must be a number between 1 and 10000" 
                };
            }
            
            const auth = getAuth(app);
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                return {
                    success: false,
                    error: "Authentication required"
                };
            }
            
            const db = getFirestore(app);
            
            // Generate a unique promo code
            let promoCode = generatePromoCode();
            let isUnique = false;
            
            // Ensure the promo code is unique
            while (!isUnique) {
                const promoRef = doc(db, 'promo-codes', promoCode);
                const promoDoc = await getDoc(promoRef);
                
                if (!promoDoc.exists()) {
                    isUnique = true;
                } else {
                    promoCode = generatePromoCode();
                }
            }
            
            // Calculate expiration date based on the provided expirationDays
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
            
            // Create the promo code document
            const promoData = {
                code: promoCode,
                tokenAmount,
                description,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.uid,
                expiresAt: expirationDate.toISOString(),
                isUsed: false,
                usedBy: null,
                usedAt: null
            };
            
            // Save to Firestore
            const promoRef = doc(db, 'promo-codes', promoCode);
            await setDoc(promoRef, promoData);
            
            // Add the new promo code to the local state
            setPromoCodes(prev => [
                {
                    ...promoData,
                    code: promoCode
                } as PromoCode,
                ...prev
            ]);
            
            return {
                success: true,
                promoCode
            };
        } catch (err: any) {
            console.error('Error creating promo code:', err);
            return {
                success: false,
                error: err.message || 'Failed to create promo code'
            };
        }
    }, []);

    // Delete a promo code
    const deletePromoCode = useCallback(async (code: string) => {
        try {
            // First check if the promo code exists and is not used
            const promoCode = promoCodes.find(p => p.code === code);

            if (!promoCode) {
                return {
                    success: false,
                    error: 'Promo code not found'
                };
            }

            if (promoCode.isUsed) {
                return {
                    success: false,
                    error: 'Cannot delete a used promo code'
                };
            }

            // Delete from Firestore
            const db = getFirestore(app);
            const promoRef = doc(db, 'promo-codes', code);
            await deleteDoc(promoRef);

            // Update local state
            setPromoCodes(prev => prev.filter(p => p.code !== code));

            return {
                success: true
            };
        } catch (err: any) {
            console.error('Error deleting promo code:', err);
            return {
                success: false,
                error: err.message || 'Failed to delete promo code'
            };
        }
    }, [promoCodes]);

    return {
        promoCodes,
        loading,
        error,
        fetchPromoCodes,
        createPromoCode,
        deletePromoCode
    };
}