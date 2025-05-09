import { useState, useEffect } from 'react';
import { useUserProjects } from './useUserProjects';
import { useProjectImages } from './useProjectImages';

interface ProjectWithImages {
    id: string;
    name: string;
    description: string;
    images: { id: string; url: string }[];
}

export function useUserProjectsWithImages() {
    const { projects, loading: projectsLoading, error: projectsError } = useUserProjects();
    const [projectsWithImages, setProjectsWithImages] = useState<ProjectWithImages[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjectsWithImages = async () => {
            try {
                const projectsData = await Promise.all(
                    projects.map(async (project) => {
                        const { images, error: imagesError } = useProjectImages(project.id);

                        if (imagesError) {
                            throw new Error(imagesError);
                        }

                        return {
                            ...project,
                            images,
                        };
                    })
                );

                setProjectsWithImages(projectsData);
            } catch (err) {
                console.error('Error fetching projects with images:', err);
                setError('Failed to load projects with images');
            } finally {
                setLoading(false);
            }
        };

        if (!projectsLoading) {
            fetchProjectsWithImages();
        }
    }, [projects, projectsLoading]);

    return { projectsWithImages, loading, error: error || projectsError };
}