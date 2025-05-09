import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

export function useJobUpdates(jobId: string, onChange: (data: ImageGenerationJob) => void) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const db = getFirestore(app);
        const jobRef = doc(db, 'jobs', jobId);

        const unsubscribe = onSnapshot(jobRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                onChange(docSnapshot.data() as ImageGenerationJob);
                setLoading(false);
            } else {
                setError('Job does not exist');
                setLoading(false);
            }
        }, (err) => {
            console.error(err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [jobId, onChange]);

    return { loading, error };
}