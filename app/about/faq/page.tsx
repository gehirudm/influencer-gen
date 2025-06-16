"use client"

import React, { useState } from 'react';
import { Container, Title, Text, Accordion } from '@mantine/core';
import Footer from '@/components/Footer/Footer';
import styles from './FAQPage.module.css';
import { IconChevronDown } from '@tabler/icons-react';

const faqs = [
  {
    question: 'How do I contact the Fantazy.Pro team?',
    answer: 'You can email us at hello@fantazy.pro. Alternatively, join our Telegram group where you can speak to the team directly.'
  },
  {
    question: 'I signed up for an account and didn\'t get any free tokens. Why?',
    answer: 'We check the IP address of every new signup. If the IP address was previously used, we will not issue the free tokens. Additionally, if you signed up using a VPN, we cannot recognise the IP address and will not issue the tokens.'
  },
  {
    question: 'What is Flux and how do I access it?',
    answer: 'Flux is a revolutionary new AI model which produces photorealistic, highly detailed results with amazing accuracy against text prompts. We have two versions of Flux available: Flux Dev and Flux Dev Custom. The latter is geared towards more explicit NSFW image creation.\n\nTo access both Flux models on Fantazy.Pro, you need to purchase the Creator or Master pack.'
  },
  {
    question: 'How do I post to the discover page and do I get any rewards?',
    answer: 'To post, locate the "post to discover" button beneath any image on your create page. Simply select an image, click the button, add a title, and you\'re done.\n\nYou\'ll receive 50 tokens when we approve your post. Additionally, you\'ll earn 20 tokens each time another user likes or saves your image.'
  },
  {
    question: 'Some of my images are distorted with things like extra fingers. How do I fix it?',
    answer: 'While we use the best AI models available on Fantazy.Pro, occasional imperfections can occur. You can easily fix any distortions using our inpaint feature.'
  },
  {
    question: 'Do tokens expire? Do I have to buy them again every month?',
    answer: 'No, tokens do not expire.'
  },
  {
    question: 'Is there an affiliate program?',
    answer: 'Not at this time.'
  },
  {
    question: 'I just sent a crypto payment but didn\'t get my tokens. What happened?',
    answer: 'To complete your purchase, submit your payment\'s transaction hash through the "direct crypto" form on the pricing page. Your tokens will be credited instantly.'
  }
];

export default function FAQPage() {
  return (
    <>
      <div className={styles.wrapper}>
        <Container size="xl">
          <Title className={styles.title}>FAQs</Title>
          <Text className={styles.subtitle}>
            If you don't find the answer you're looking for, please contact us.
          </Text>

          <div className={styles.accordionContainer}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                classNames={{
                  item: styles.item,
                  control: styles.control,
                  content: styles.content,
                  chevron: styles.chevron,
                  panel: styles.panel
                }}
                chevron={<IconChevronDown size={24} />}
              >
                <Accordion.Item value={`faq-${index}`}>
                  <Accordion.Control>{faq.question}</Accordion.Control>
                  <Accordion.Panel>{faq.answer}</Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}