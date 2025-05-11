"use client"

import { GenJobCard } from '@/components/GenJobCard/GenJobCard';
import ImageMaskEditor from '@/components/ImageMaskEditor';
import ImageRadioGroup from '@/components/ImageRadioGroup/ImageRadioGroup';
import { ProjectCheckBox } from '@/components/ProjectCheckBox/ProjectCheckBox';
import { SimpleGrid } from '@mantine/core';

const icons = [
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1605774337664-7a846e9cdf17?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80',
];

const mockdata = [
    { imageCount: 5, title: 'Beach vacation with your mother', image: icons[0], createdAt: new Date('2024-12-01') },
    { imageCount: 8, title: 'City trips', image: icons[1], createdAt: new Date('2024-09-15') },
    { imageCount: 11, title: 'Hiking vacation', image: icons[2], createdAt: new Date('2024-08-20') },
    { imageCount: 0, title: 'Winter vacation', image: icons[3], createdAt: new Date('2024-07-10') },
];

export function ImageCheckboxes() {
    const items = mockdata.map((item) => <ProjectCheckBox {...item} key={item.title} />);
    return <SimpleGrid cols={{ base: 1, sm: 2 }}>{items}</SimpleGrid>;
}

export default function ImageGeneratorPage() {
    const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2F47aa67b4-9f4e-4e67-8c32-7359739fd28c-e1-image_0.png?alt=media&token=6982b9b2-e02d-4342-b039-c4abfaa1680b';

    const images = [
        { imgUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80', imageId: "1" },
        { imgUrl: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80', imageId: "2" },
        { imgUrl: 'https://images.unsplash.com/photo-1605774337664-7a846e9cdf17?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80', imageId: "3" },
        { imgUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=720&q=80', imageId: "4" },
    ];

    const handleConfirm = (maskDataURL: string) => {
        console.log('Mask Data URL:', maskDataURL);
        // You can handle the mask data URL here, e.g., send it to a server or display it
    };

    return (
        <div>
            <h1>Image Mask Editor</h1>
            <ImageMaskEditor
                imageUrl={imageUrl}
                width={720}
                height={1280}
                onConfirm={handleConfirm}
            />
            {/* <GenJobCard
                prompt="Beach vacation with your mother"
                status="Completed"
                dimensions={{ width: 720, height: 1024 }}
                aspectRatio="16:9"
                batchSize={1}
                userProjects={[]}
                imageUrls={[imageUrl, imageUrl, imageUrl]}
            ></GenJobCard>
            <ImageCheckboxes />
            <ImageRadioGroup images={images} ></ImageRadioGroup> */}
        </div>
    );
}