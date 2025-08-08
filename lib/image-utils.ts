export const convertImageUrlToDataUrl = async (imageUrl: string): Promise<string | null> => new Promise(async (resolve, reject) => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
        reader.readAsDataURL(blob);
    } catch (error: any) {
        reject(new Error(`Error converting image URL to data URL: ${error.message}`));
    }
});
