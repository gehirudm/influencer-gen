import { Anchor, Chip, Group, Text, Box, Stack } from '@mantine/core';
import { useState } from 'react';
import classes from './ChipSelectionWithLineClamp.module.css';

interface CharacterCardProps {
    data: ChipData[];
    header?: string;
    onChange?: (value: string | string[]) => void;
    value?: string;
    multiple?: boolean;
    withImages?: boolean;
}

interface ChipData {
    label: string;
    value: string;
    image?: string;
}

export function ChipSelectionWithLineClamp(props: CharacterCardProps) {
    const [expanded, setExpanded] = useState(false);
    const { data, header, withImages } = props;

    // Calculate if we need "show more" button (assuming average of 5 chips per line)
    const hasMoreContent = data.length > 10;

    // Determine which clamp container class to use based on withImages prop
    const clampContainerClass = expanded 
        ? '' 
        : withImages 
            ? classes.clampContainerWithImages 
            : classes.clampContainer;

    return (
        <Stack gap="xs">
            {header && (
                <Text fw={500} size="sm">{header}</Text>
            )}
            <Box className={clampContainerClass}>
                <Chip.Group value={props.value} onChange={props.onChange} multiple={props.multiple ? props.multiple : false}>
                    <Group justify="start" gap="xs">
                        {data.map((chip) => (
                            withImages && chip.image ? (
                                <Chip
                                    key={chip.value}
                                    value={chip.value}
                                    classNames={{
                                        root: classes.imageChipRoot,
                                        label: classes.imageChipLabel
                                    }}
                                    style={{
                                        backgroundImage: `url(${chip.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                    
                                >
                                    {chip.label}
                                </Chip>
                            ) : (
                                <Chip key={chip.value} value={chip.value} color="yellow" variant="light" radius="md">
                                    {chip.label}
                                </Chip>
                            )
                        ))}
                    </Group>
                </Chip.Group>
            </Box>
            {hasMoreContent && (
                <Anchor
                    component="button"
                    onClick={() => setExpanded(!expanded)}
                    size="sm"
                    ta="center"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </Anchor>
            )}
        </Stack>
    );
}