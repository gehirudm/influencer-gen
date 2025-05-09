import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '@/lib/firebase';

interface ImageData {
    id: string;
    url: string;
}

export function useProjectImages(projectId: string) {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const db = getFirestore(app);
                const imagesRef = collection(db, 'images');
                const q = query(imagesRef, where('projectId', '==', projectId));
                const querySnapshot = await getDocs(q);

                const projectImages = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    url: doc.data().url, // Assuming the image URL is stored in a field named 'url'
                }));

                setImages(projectImages);
            } catch (error) {
                console.error('Error fetching images:', error);
                setError('Failed to load images');
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [projectId]);

    return { images, loading, error };
}