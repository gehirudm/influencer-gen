import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { notifications } from '@mantine/notifications';

interface JobData {
    id: string;
    userId: string;
    status: string;
    metadata: ImageGenerationMetadata;
    createdAt: string;
    imageUrls?: string[];
    imageIds?: string[];
    executionTime: number;
    baseImagePath?: string;
    maskImagePath?: string;
}

export function useUserJobs() {
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const imageUrlsCache = new Map<string, string[]>();

    const deleteJob = async (jobId: string, onComplete?: () => void, onError?: (error: Error) => void) => {
        if (!user?.uid) {
            const error = new Error('User not authenticated');
            notifications.show({
                title: 'Error',
                message: error.message,
                color: 'red',
            });
            if (onError) onError(error);
            return;
        }

        const notificationId = notifications.show({
            title: 'Deleting Job',
            message: 'Please wait while we delete the job...',
            loading: true,
            autoClose: false,
            withCloseButton: false,
        });

        try {
            const db = getFirestore(app);
            const storage = getStorage(app);
            
            // Get the job document
            const jobRef = doc(db, 'jobs', jobId);
            const jobDoc = await getDoc(jobRef);
            
            if (!jobDoc.exists()) {
                throw new Error('Job not found');
            }
            
            const jobData = jobDoc.data() as JobData;
            
            // Verify the job belongs to the user
            if (jobData.userId !== user.uid) {
                throw new Error('You do not have permission to delete this job');
            }
            
            // Delete generated images if they exist
            if (jobData.imageIds && Array.isArray(jobData.imageIds)) {
                const deleteImagePromises = jobData.imageIds.map(async (imageId: string) => {
                    const imagePath = `generated-images/${user.uid}/${imageId}.png`;
                    try {
                        const imageRef = ref(storage, imagePath);
                        await deleteObject(imageRef);
                        console.log(`Deleted generated image: ${imagePath}`);
                    } catch (error) {
                        console.error(`Error deleting generated image ${imagePath}:`, error);
                        // Continue with deletion even if some images fail to delete
                    }
                });
                
                await Promise.all(deleteImagePromises);
            }
            
            // Delete base image if it exists
            if (jobData.baseImagePath) {
                try {
                    const baseImageRef = ref(storage, jobData.baseImagePath);
                    await deleteObject(baseImageRef);
                    console.log(`Deleted base image: ${jobData.baseImagePath}`);
                } catch (error) {
                    console.error(`Error deleting base image ${jobData.baseImagePath}:`, error);
                }
            }
            
            // Delete mask image if it exists
            if (jobData.maskImagePath) {
                try {
                    const maskImageRef = ref(storage, jobData.maskImagePath);
                    await deleteObject(maskImageRef);
                    console.log(`Deleted mask image: ${jobData.maskImagePath}`);
                } catch (error) {
                    console.error(`Error deleting mask image ${jobData.maskImagePath}:`, error);
                }
            }
            
            // Delete the job document
            await deleteDoc(jobRef);
            
            notifications.update({
                id: notificationId,
                title: 'Success',
                message: 'Job deleted successfully!',
                color: 'green',
                loading: false,
                autoClose: 3000,
                withCloseButton: true,
            });
            
            if (onComplete) onComplete();
        } catch (error: any) {
            console.error('Error deleting job:', error);
            
            notifications.update({
                id: notificationId,
                title: 'Error',
                message: error.message || 'Failed to delete job',
                color: 'red',
                loading: false,
                autoClose: 5000,
                withCloseButton: true,
            });
            
            if (onError) onError(error);
        }
    };

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

    return { jobs, loading, error, deleteJob };
}