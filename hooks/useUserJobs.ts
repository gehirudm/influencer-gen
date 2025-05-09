import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface JobData {
    id: string;
    status: string;
    metadata: ImageGenerationMetadata;
    createdAt: string;
    imageUrls?: string[];
    imageIds?: string[];
    executionTime: number;
}

export function useUserJobs() {
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const imageUrlsCache = new Map<string, string[]>();

    useEffect(() => {
        if (!user?.uid) return;

        const db = getFirestore(app);
        const storage = getStorage(app);
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const jobsData: JobData[] = [];

            for (const doc of querySnapshot.docs) {
                const jobData = doc.data() as JobData;
                jobData.id = doc.id;

                if (jobData.status === 'COMPLETED' && jobData.imageIds) {
                    if (imageUrlsCache.has(jobData.id)) {
                        jobData.imageUrls = imageUrlsCache.get(jobData.id);
                    } else {
                        const imageUrls = await Promise.all(
                            jobData.imageIds.map(async (imageId: string) => {
                                const imageRef = ref(storage, `generated-images/${user.uid}/${imageId}.png`);
                                return getDownloadURL(imageRef);
                            })
                        );

                        jobData.imageUrls = imageUrls;
                        imageUrlsCache.set(jobData.id, imageUrls);
                    }
                }

                jobsData.push(jobData);
            }

            setJobs(jobsData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching user jobs:', err);
            setError('Failed to load jobs');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { jobs, loading, error };
}