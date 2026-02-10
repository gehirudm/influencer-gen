import { Anchor, Button, Card, Overlay, Text } from '@mantine/core';
import classes from './CharacterCard.module.css';
import { useRouter } from 'next/navigation';

interface CharacterCardProps {
    name: string;
    image: string;
    characterId: string;
}

export function CharacterCard(props: CharacterCardProps) {
    const router = useRouter();

    return (
        <Anchor rel={`character/view/id=${props.characterId}`}>
            <Card radius="md" className={classes.card} style={{ backgroundImage: `url(${props.image})` }}>
                <Overlay className={classes.overlay} opacity={0.55} zIndex={0} />

                <div className={classes.content}>
                    <Text size="lg" fw={700} className={classes.title}>
                        {props.name}
                    </Text>

                    <Button className={classes.action} variant="white" color="dark" size="xs" onClick={() => router.push("/generate-images?characterId=" + props.characterId)}>
                        Use Character
                    </Button>
                </div>
            </Card>
        </Anchor>
    );
}