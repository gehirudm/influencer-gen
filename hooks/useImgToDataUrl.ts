import { useState, useEffect } from 'react';

/**
 * Custom hook to convert an image URL to a data URL
 * @param imageUrl The URL of the image to convert
 * @returns An object containing the data URL, loading state, and any error
 */
export function useImageToDataUrl(imageUrl: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setDataUrl(null);
      return;
    }

    const convertToDataUrl = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch the image as a blob
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setDataUrl(reader.result as string);
          setLoading(false);
        };
        
        reader.onerror = () => {
          setError(new Error('Failed to convert image to data URL'));
          setLoading(false);
        };
        
        reader.readAsDataURL(blob);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setLoading(false);
      }
    };

    convertToDataUrl();
  }, [imageUrl]);

  return { dataUrl, loading, error };
}