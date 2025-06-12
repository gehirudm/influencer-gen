"use client";

import { Container, Title, Text, Divider, Stack, Box } from '@mantine/core';
import classes from './NewsPage.module.css';

export default function NewsPage() {
    return (
        <Container size="md" className={classes.container}>
            <Title order={1} className={classes.mainTitle}>
                News
            </Title>

            <Box className={classes.content}>
                {/* <Title order={2} className={classes.monthTitle}>
                    December
                </Title> */}

                <Divider my="lg" className={classes.divider} />

                <Stack gap="xl">
                    <Box className={classes.newsItem}>
                        <Title order={3} className={classes.newsTitle}>
                            Post to Discover and win tokens
                        </Title>
                        
                        <Stack gap="md" className={classes.paragraphStack}>
                            <Text className={classes.paragraph}>
                                We've made it more rewarding than ever to showcase your best creations on the Discover 
                                page by giving away 50 tokens for every image you submit!
                            </Text>
                            
                            <Text className={classes.paragraph}>
                                If another user likes or saves your image, you get another 20 tokens!
                            </Text>
                            
                            <Text className={classes.paragraph}>
                                We'll be announcing some additional rewards soon but rest assured, if you are one of our top 
                                creators there are thousands of free tokens to be won!
                            </Text>
                        </Stack>
                    </Box>

                    <Divider my="lg" className={classes.divider} />

                    <Box className={classes.newsItem}>
                        <Title order={3} className={classes.newsTitle}>
                            Improved filtering on the create page
                        </Title>
                        
                        <Text className={classes.paragraph}>
                            We've made it easier to find specific creations by improving pagination and allowing to sort by 
                            creation date and filter your images by individual character.
                        </Text>
                    </Box>
                </Stack>
            </Box>
        </Container>
    );
}