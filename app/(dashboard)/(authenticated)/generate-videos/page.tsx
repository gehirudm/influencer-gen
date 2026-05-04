"use client"

import { useMediaQuery } from '@mantine/hooks';
import {
    Box,
    Grid,
    Stack,
    Card,
    Textarea,
    NumberInput,
    Select,
    TextInput,
    Group,
    Text,
    Button,
    ScrollArea,
} from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';

export default function GenerateVideosPage() {
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <Box style={{ height: '100%', width: '100%' }} pt={{ base: 'sm', md: 0 }}>
            <Grid gutter="xs" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Inputs */}
                <Grid.Col
                    span={{ base: 12, md: 8 }}
                    style={{
                        height: isMobile ? 'auto' : 'calc(100vh - 40px)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: isMobile ? '0.25rem 0.15rem' : '0.75rem',
                    }}
                >
                    <ScrollArea
                        style={{ flex: 1, marginBottom: isMobile ? '0.5rem' : '1rem' }}
                        scrollbarSize={isMobile ? 0 : 10}
                        offsetScrollbars={!isMobile}
                        styles={{
                            scrollbar: {
                                '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                                    backgroundColor: '#4a7aba',
                                },
                                '&:hover [data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                                    backgroundColor: '#5a8aca',
                                },
                            },
                        }}
                    >
                        <Stack gap={isMobile ? 'xs' : 'md'} pl={isMobile ? 'sm' : 0} pr={isMobile ? 'sm' : 'md'}>
                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Prompt</Text>
                                <Textarea
                                    label="Video Prompt"
                                    placeholder="Describe the video you want to generate..."
                                    minRows={4}
                                />
                            </Card>

                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Settings</Text>
                                <Group grow align="flex-start">
                                    <NumberInput
                                        label="Frame Rate"
                                        description="Frames per second"
                                        min={1}
                                        max={120}
                                        defaultValue={24}
                                    />
                                    <NumberInput
                                        label="Length (frames)"
                                        description="Total frames"
                                        min={1}
                                        max={9999}
                                        defaultValue={97}
                                    />
                                </Group>
                                <Select
                                    mt="sm"
                                    label="Resolution"
                                    description="Output size"
                                    data={[
                                        { value: '1920x1088', label: '1920 x 1088 (LTX 2.3)' },
                                        { value: '1536x864', label: '1536 x 864' },
                                        { value: '1280x768', label: '1280 x 768' },
                                        { value: '1024x576', label: '1024 x 576' },
                                        { value: '768x512', label: '768 x 512' },
                                    ]}
                                    defaultValue="1920x1088"
                                />
                            </Card>

                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Custom Settings</Text>
                                <Stack gap="md">
                                    <Textarea
                                        label="Negative Prompt"
                                        placeholder="What you don't want in the video..."
                                        minRows={2}
                                    />
                                    <Group grow align="flex-start">
                                        <NumberInput
                                            label="Steps"
                                            description="Inference steps"
                                            min={1}
                                            max={200}
                                            defaultValue={30}
                                        />
                                        <NumberInput
                                            label="CFG Scale"
                                            description="Prompt adherence"
                                            min={1}
                                            max={20}
                                            step={0.5}
                                            decimalScale={1}
                                            defaultValue={7}
                                        />
                                        <NumberInput
                                            label="LoRA Strength"
                                            description="LoRA intensity"
                                            min={0}
                                            max={2}
                                            step={0.05}
                                            decimalScale={2}
                                            defaultValue={1}
                                        />
                                    </Group>
                                    <TextInput
                                        label="Seed"
                                        placeholder="Leave empty for random"
                                        description="Use a specific seed for reproducible results"
                                    />
                                </Stack>
                            </Card>
                        </Stack>
                    </ScrollArea>

                    <Box px={isMobile ? 'sm' : 0}>
                        <Button fullWidth size="lg">
                            Generate (<span style={{ color: '#FBBF24' }}>100</span> Tokens)
                        </Button>
                    </Box>
                </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col
                    span={{ base: 12, md: 4 }}
                    style={{
                        height: isMobile ? 'auto' : 'calc(100vh - 40px)',
                        padding: isMobile ? '0.25rem 0.15rem' : '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Stack gap="md" px={isMobile ? 'sm' : 0} style={{ flex: 1, overflow: 'hidden' }}>
                        <Card
                            p="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444',
                                flex: isMobile ? undefined : 1,
                                minHeight: isMobile ? '200px' : 0,
                                maxHeight: isMobile ? '260px' : undefined,
                            }}
                        >
                            <Box
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #555',
                                    overflow: 'hidden',
                                }}
                            >
                                <Stack align="center" gap="sm">
                                    <IconPhoto size={64} color="#666" />
                                    <Text c="dimmed" size="lg">Output Preview</Text>
                                    <Text c="dimmed" size="sm">Your generated video will appear here</Text>
                                </Stack>
                            </Box>
                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Box>
    );
}
