import { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
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
    imageUrls?: ImageURLS[];
    imageIds?: string[];
    executionTime: number;
    baseImagePath?: string;
    maskImagePath?: string;
}

interface ImageURLS { publicUrl: string, privateUrl: string };

type SortOrder = 'newest' | 'oldest';

export function useUserJobs(initialPageSize: number = 10, initialSortOrder: SortOrder = 'newest') {
    const auth = getAuth(app);
    const user = auth.currentUser;

    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const imageUrlsCache = new Map<string, ImageURLS[]>();

    // Function to delete a job
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

            // Delete the job document
            await deleteDoc(jobRef);

            // Update local state
            setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));

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

    // Function to change sort order
    const changeSortOrder = (newSortOrder: SortOrder) => {
        if (newSortOrder !== sortOrder) {
            setSortOrder(newSortOrder);
            setJobs([]);
            setLastVisible(null);
            setHasMore(true);
            setLoading(true);
        }
    };

    // Function to load more jobs
    const loadMoreJobs = useCallback(async () => {
        if (!user?.uid || !hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const db = getFirestore(app);
            const jobsRef = collection(db, 'jobs');
            
            let q = query(
                jobsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', sortOrder === 'newest' ? 'desc' : 'asc'),
                limit(initialPageSize)
            );

            if (lastVisible) {
                q = query(
                    jobsRef,
                    where('userId', '==', user.uid),
                    orderBy('createdAt', sortOrder === 'newest' ? 'desc' : 'asc'),
                    startAfter(lastVisible),
                    limit(initialPageSize)
                );
            }

            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setHasMore(false);
                setLoadingMore(false);
                return;
            }

            const newJobsData: JobData[] = [];
            
            querySnapshot.forEach((doc) => {
                const jobData = doc.data() as JobData;
                jobData.id = doc.id;
                
                // Skip jobs with COMPLETED status but no imageUrls (backward compatibility)
                if (jobData.status === 'COMPLETED' && !jobData.imageUrls) {
                    return;
                }
                
                newJobsData.push(jobData);
            });

            // Update last visible document for pagination
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc);
            
            // Append new jobs to existing jobs
            setJobs(prevJobs => [...prevJobs, ...newJobsData]);
            
            // Check if there might be more jobs to load
            setHasMore(querySnapshot.size === initialPageSize);
        } catch (err) {
            console.error('Error loading more jobs:', err);
            setError('Failed to load more jobs');
        } finally {
            setLoadingMore(false);
        }
    }, [user, hasMore, loadingMore, lastVisible, sortOrder, initialPageSize]);

    // Function to get and update a specific job
    const refreshJob = useCallback(async (jobId: string) => {
        if (!user?.uid) return null;

        try {
            const db = getFirestore(app);
            const jobRef = doc(db, 'jobs', jobId);
            const jobDoc = await getDoc(jobRef);

            if (!jobDoc.exists()) {
                console.error(`Job with ID ${jobId} not found`);
                return null;
            }

            const jobData = jobDoc.data() as JobData;
            jobData.id = jobDoc.id;

            // Update the job in the jobs array if it exists
            setJobs(prevJobs => {
                const jobIndex = prevJobs.findIndex(job => job.id === jobId);
                if (jobIndex !== -1) {
                    const updatedJobs = [...prevJobs];
                    updatedJobs[jobIndex] = jobData;
                    return updatedJobs;
                }
                return prevJobs;
            });

            return jobData;
        } catch (err) {
            console.error(`Error refreshing job ${jobId}:`, err);
            return null;
        }
    }, [user]);

    // Initial load and real-time updates for the first page
    useEffect(() => {
        if (!user?.uid) return;

        setLoading(true);
        setJobs([]);
        setLastVisible(null);
        setHasMore(true);

        const db = getFirestore(app);
        const jobsRef = collection(db, 'jobs');
        const q = query(
            jobsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', sortOrder === 'newest' ? 'desc' : 'asc'),
            limit(initialPageSize)
        );

        // Set up real-time listener for the first page only
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const jobsData: JobData[] = [];

            // Update last visible document for pagination
            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                setLastVisible(lastDoc);
            }

            for (const doc of querySnapshot.docs) {
                const jobData = doc.data() as JobData;
                jobData.id = doc.id;

                // Skip jobs with COMPLETED status but no imageUrls (backward compatibility)
                if (jobData.status === 'COMPLETED' && !jobData.imageUrls) {
                    continue;
                }

                jobsData.push(jobData);
            }

            setJobs(jobsData);
            setLoading(false);
            setHasMore(querySnapshot.size === initialPageSize);
        }, (err) => {
            console.error('Error fetching user jobs:', err);
            setError('Failed to load jobs');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, sortOrder, initialPageSize]);

    return { 
        jobs, 
        loading, 
        loadingMore, 
        error, 
        hasMore, 
        sortOrder,
        deleteJob, 
        loadMoreJobs, 
        changeSortOrder,
        refreshJob
    };
}