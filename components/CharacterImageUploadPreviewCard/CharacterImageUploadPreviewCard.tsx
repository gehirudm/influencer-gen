import { Anchor, Button, Card, Overlay, Text, Group, ActionIcon } from '@mantine/core';
import classes from './CharacterImageUploadPreviewCard.module.css';
import { useRouter } from 'next/navigation';
import { IconTrash, IconCrop } from '@tabler/icons-react';

interface CharacterImageUploadPreviewCardProps {
    image: string;
    onRemove?: () => void;
    onRecrop?: () => void;
}

export function CharacterImageUploadPreviewCard(props: CharacterImageUploadPreviewCardProps) {
    const { onRemove, onRecrop } = props;

    const handleButtonClick = (e: React.MouseEvent, callback?: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        if (callback) callback();
    };

    return (
        <Card radius="md" className={classes.card} style={{ backgroundImage: `url(${props.image})` }}>
            <div className={classes.actionButtons}>
                <Group gap="xs">
                    <ActionIcon
                        variant="filled"
                        color="red"
                        radius="xl"
                        size="md"
                        onClick={(e) => handleButtonClick(e, onRemove)}
                        aria-label="Remove image"
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="filled"
                        color="blue"
                        radius="xl"
                        size="md"
                        onClick={(e) => handleButtonClick(e, onRecrop)}
                        aria-label="Recrop image"
                    >
                        <IconCrop size={16} />
                    </ActionIcon>
                </Group>
            </div>
        </Card>
    );
}