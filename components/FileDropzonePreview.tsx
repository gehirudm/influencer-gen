import { Group, Text, Image } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useState } from 'react';

interface FileDropzonePreviewProps extends Partial<DropzoneProps> {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
}

export function FileDropzonePreview({ selectedImage, setSelectedImage, ...props }: FileDropzonePreviewProps) {
    const [loading, setLoading] = useState(false);
    
    const handleDrop = (files: File[]) => {
        setLoading(true);
        const file = files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64String = reader.result as string;
            setSelectedImage(base64String);
            setLoading(false);
        };

        reader.readAsDataURL(file);
    };

    return (
        <Dropzone
            onDrop={handleDrop}
            onReject={(files) => console.log('rejected files', files)}
            maxSize={5 * 1024 ** 2}
            accept={['image/png', 'image/jpeg', 'image/jpg']}
            maxFiles={1}
            loading={loading || props.loading}
            {...props}
        >
            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                    <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                </Dropzone.Idle>
                {selectedImage ?
                    <Image src={selectedImage} alt="Selected Image" fit="contain" height={220} /> :
                    <div>
                        <Text size="xl" inline>
                            Upload Image
                        </Text>
                        <Text size="sm" c="dimmed" inline mt={7}>
                            Accepts PNG, JPEG, and JPG formats.
                        </Text>
                    </div>
                }
            </Group>
        </Dropzone >
    );
}