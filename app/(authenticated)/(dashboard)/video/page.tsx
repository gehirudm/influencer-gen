'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Box, 
  TextInput,
  Paper,
  Transition,
  ActionIcon
} from '@mantine/core';
import { IconRocket, IconMail, IconBrandTwitter, IconBrandInstagram } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './ComingSoonPage.module.css';

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [mounted, setMounted] = useState(false);
  const [animateRocket, setAnimateRocket] = useState(false);

  // Set launch date to 30 days from now
  useEffect(() => {
    setMounted(true);
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 30);
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(timer);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    
    // Animate rocket periodically
    const rocketTimer = setInterval(() => {
      setAnimateRocket(true);
      setTimeout(() => setAnimateRocket(false), 1000);
    }, 3000);
    
    return () => {
      clearInterval(timer);
      clearInterval(rocketTimer);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Here you would typically send this to your backend
    notifications.show({
      title: 'Thank you for subscribing!',
      message: 'We will notify you when we launch.',
      color: 'blue',
    });
    
    setEmail('');
  };

  const CountdownItem = ({ value, label }: { value: number, label: string }) => (
    <Transition mounted={mounted} transition="pop" duration={300} timingFunction="ease">
      {(styles) => (
        <Paper 
          className={classes.countdownItem}
          p="md"
          radius="md"
          style={styles}
        >
          <Text size="xl" fw={700}>{value.toString().padStart(2, '0')}</Text>
          <Text size="xs" c="dimmed">{label}</Text>
        </Paper>
      )}
    </Transition>
  );

  return (
    <Container size="md" py={120} className={classes.container}>
      <Transition mounted={mounted} transition="fade" duration={400}>
        {(styles) => (
          <Stack gap="xl" style={styles}>
            <Transition mounted={mounted} transition="slide-down" duration={500}>
              {(titleStyles) => (
                <Title 
                  className={classes.title}
                  ta="center"
                  style={titleStyles}
                >
                  Something{' '}
                  <Text 
                    component="span" 
                    variant="gradient" 
                    gradient={{ from: 'pink', to: 'yellow' }}
                    inherit
                  >
                    Amazing
                  </Text>{' '}
                  is Coming Soon
                </Title>
              )}
            </Transition>
            
            <Transition mounted={mounted} transition="fade" duration={600} enterDelay={200}>
              {(textStyles) => (
                <Text c="dimmed" ta="center" size="lg" maw={600} mx="auto" style={textStyles}>
                  We're working hard to bring you an incredible new feature. 
                  Subscribe to get notified when we launch!
                </Text>
              )}
            </Transition>
            
            <Group justify="center" gap="md" className={classes.countdownContainer}>
              <CountdownItem value={countdown.days} label="Days" />
              <CountdownItem value={countdown.hours} label="Hours" />
              <CountdownItem value={countdown.minutes} label="Minutes" />
              <CountdownItem value={countdown.seconds} label="Seconds" />
            </Group>
          </Stack>
        )}
      </Transition>
      
      {/* Background elements */}
      <div className={classes.backgroundGradient}></div>
      {/* <div className={classes.backgroundDots}></div> */}
    </Container>
  );
}