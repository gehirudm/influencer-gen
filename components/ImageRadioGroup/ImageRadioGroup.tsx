import { useState } from 'react';
import { Radio, Group, Image, Text } from '@mantine/core';
import classes from './ImageRadioGroup.module.css';

interface ImageRadioGroupProps {
    onChange?: (imageId: string) => void;
    initialValue?: string;
    images: Image[];
}

interface Image {
    imgUrl: string;
    imageId: string;
}

export default function ImageRadioGroup(props: ImageRadioGroupProps) {
    const [value, setValue] = useState<string | null>(null);

    const cards = props.images.map((item) => (
        <Radio.Card className={classes.root} radius="md" value={item.imageId} key={item.imageId}>
            <Image src={item.imgUrl} className={classes.image} radius="md" fit='cover' />
        </Radio.Card>
    ));

    return (
        <>
            <Radio.Group
                value={value}
                onChange={setValue}
            >
                <Group pt="md" gap="xs" justify='start'>
                    {cards}
                </Group>
            </Radio.Group>
        </>
    );
}