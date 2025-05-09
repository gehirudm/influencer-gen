import { useState, useEffect } from 'react';
import { getAuth, User } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import app from '@/lib/firebase';

export function useUserProjects() {
    const [projects, setProjects] = useState<(UserProject & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            const auth = getAuth(app);
            const user = auth.currentUser as User;

            if (!user) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            try {
                const db = getFirestore(app);
                const projectsRef = collection(db, 'projects');
                const q = query(projectsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);

                const userProjects = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data() as UserProject,
                }));

                setProjects(userProjects);
            } catch (error) {
                console.error('Error fetching projects:', error);
                setError('Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return { projects, loading, error };
}