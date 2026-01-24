'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CharacterCreation() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to character page since we now use modal
        router.push('/character');
    }, [router]);
    
    return null;
}