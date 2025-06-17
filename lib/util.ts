/**
 * Helper function to get the file extension from filename or MIME type
 * @param fileName Original file name
 * @param mimeType File MIME type
 * @returns Appropriate file extension without the dot
 */
export function getFileExtension(fileName: string, mimeType: string): string {
    // First try to get extension from filename
    const fileNameExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileNameExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileNameExtension)) {
        return fileNameExtension;
    }
    
    // If no valid extension in filename, determine from MIME type
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/gif':
            return 'gif';
        case 'image/webp':
            return 'webp';
        case 'image/bmp':
            return 'bmp';
        case 'image/svg+xml':
            return 'svg';
        default:
            // Default to jpg if unknown
            return 'jpg';
    }
}