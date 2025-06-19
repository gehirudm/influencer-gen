import { useState, useEffect, useCallback } from 'react';
import { getAuth, User } from 'firebase/auth';
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
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

    // Create a new project
    const createProject = useCallback(async (name: string, description: string) => {
        setLoading(true);
        setError(null);
        
        const auth = getAuth(app);
        const user = auth.currentUser as User;

        if (!user) {
            setLoading(false);
            throw ('User not authenticated');
        }

        try {
            const db = getFirestore(app);
            const projectsRef = collection(db, 'projects');
            
            const newProject = {
                name,
                description,
                userId: user.uid,
                imageIds: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const docRef = await addDoc(projectsRef, newProject);
            
            // Add the new project to the local state
            const createdProject = {
                id: docRef.id,
                ...newProject,
                imageIds: [], // Ensure imageIds is initialized as an empty array
                imageUrls: [] // Ensure imageIds is initialized as an empty array
            };
            
            setProjects(prev => [...prev, createdProject]);
            
            return docRef.id;
        } catch (error) {
            console.error('Error creating project:', error);
            throw "Error while creating project"
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete a project
    const deleteProject = useCallback(async (projectId: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const db = getFirestore(app);
            await deleteDoc(doc(db, 'projects', projectId));
            
            // Remove the project from local state
            setProjects(prev => prev.filter(project => project.id !== projectId));
            
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw "Error while deleting project"
        } finally {
            setLoading(false);
        }
    }, []);

    // Add images to a project
    const addImagesToProject = useCallback(async (projectId: string, imageIds: string[], imageUrls: string[]) => {
        setLoading(true);
        setError(null);
        
        try {
            const db = getFirestore(app);
            const projectRef = doc(db, 'projects', projectId);
            
            // Update the project document with new imageIds
            await updateDoc(projectRef, {
                imageIds: arrayUnion(...imageIds),
                imageUrls: arrayUnion(...imageUrls),
                updatedAt: serverTimestamp()
            });
            
            // Update the local state
            setProjects(prev => 
                prev.map(project => 
                    project.id === projectId 
                        ? { 
                            ...project, 
                            imageIds: [...(project.imageIds || []), ...imageIds], 
                            imageUrls: [...(project.imageUrls || []), ...imageUrls] 
                          } 
                        : project
                )
            );
            
            return true;
        } catch (error) {
            console.error('Error adding images to project:', error);
            setError('Failed to add images to project');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { 
        projects, 
        loading, 
        error, 
        createProject, 
        deleteProject, 
        addImagesToProject,

    };
}