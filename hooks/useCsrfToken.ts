import { useState, useEffect } from 'react';

export function useCsrfToken() {
    const [csrfToken, setCsrfToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch("/api/auth/csrf");
                const data = await response.json();
                setCsrfToken(data.csrfToken);
            } catch (error) {
                console.error("Failed to fetch CSRF token:", error);
            }
        };

        fetchCsrfToken();
    }, []);

    return csrfToken;
}