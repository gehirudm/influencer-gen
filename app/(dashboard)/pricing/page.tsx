"use client"

import { createInvoiceAndRedirect } from '@/app/actions/payments/payments';
import { useUserData } from '@/hooks/useUserData';
import { Group, HoverCard, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

const pricingPlans: {
  name: string;
  planName: string;
  price: string;
  tagline: string;
  tokens: string;
  images: string;
  features: ({
    name: string;
    explanation?: string;
    available: boolean;
  }[]);
  button: string;
  highlight: boolean;
  popular?: boolean;
}[] = [
    {
      name: 'Free',
      planName: "free",
      price: '$0',
      tagline: '',
      tokens: '50 tokens',
      images: 'create up to 25 images',
      features: [
        { name: 'Simple image generation', explanation: "Generate realistic images easily without the need of complex prompts with a pre-defined set of features handcrafted for optimal image generation.", available: true },
        { name: 'Advanced image generation', explanation: "Full control over image generation parameters including negative prompts, dimensions, and other advanced settings.", available: true },
        { name: 'No watermark on images', explanation: "Download and use images without any watermarks or branding.", available: false },
        { name: 'AI Undress', explanation: "Generate tasteful artistic nude content with our specialized model.", available: false },
        { name: 'Character creation', explanation: "Create and customize your own characters with detailed appearance settings.", available: false },
        { name: 'LoRa character training', explanation: "Train a custom LoRa model for your character for consistent high-quality generations.", available: false },
        { name: 'Image Generation with Character Engine', explanation: "Generate images that match your character's specific appearance and style consistently.", available: false },
      ],
      button: 'Current plan',
      highlight: false,
    },
    {
      name: 'Basic',
      planName: "Basic Plan",
      price: '$39.99',
      tagline: 'One time fee',
      tokens: '1000 tokens',
      images: 'Create up to 750 images',
      features: [
        { name: 'All image generation features', explanation: "Full access all image generation features available.", available: true },
        { name: 'No watermark on images', explanation: "All generated images are delivered without watermarks for professional use and sharing.", available: true },
        { name: 'AI Undress', explanation: "Upload an image and generate a nude version of that image. You can tweak the characteristics to your choice", available: true },
        { name: 'Character creation', explanation: "Create and customize your own characters with detailed appearance settings and save them for future use.", available: true },
        { name: '1 LoRa character training included', explanation: "Train one custom LoRa model for your character, enabling consistent high-quality image generations.", available: true },
        { name: 'Image Generation with Character Engine', explanation: "Generate consistent images of your trained characters with perfect appearance matching across multiple generations.", available: true },
      ],
      button: 'Purchase',
      highlight: false,
    },
    {
      name: 'Premium',
      planName: "Premium Plan",
      price: '$64.99',
      tagline: 'One time fee',
      tokens: '10000 tokens',
      images: 'Create up to 3000 images',
      features: [
        { name: 'All image generation features', explanation: "Full access all image generation features available.", available: true },
        { name: 'No watermark on images', explanation: "All generated images are delivered without watermarks and at maximum available resolution.", available: true },
        { name: 'AI Undress', explanation: "Upload an image and generate a nude version of that image. You can tweak the characteristics to your choice", available: true },
        { name: 'Character creation', explanation: "Create unlimited characters with our most detailed customization options and advanced appearance settings.", available: true },
        { name: '2 LoRa character trainings included', explanation: "Train two custom LoRa models for your characters, enabling consistent high-quality image generations.", available: true },
        { name: 'Image Generation with Character Engine', explanation: "Generate the highest quality consistent images of your trained characters with perfect appearance matching and enhanced details.", available: true },
      ],
      button: 'Purchase',
      highlight: true,
      popular: true,
    },
  ];

function PricingPageMessageBox() {
  const searchParams = useSearchParams()
  const paramError = searchParams.get('error');
  const paramMessage = searchParams.get('message');

  const [errorMessage, setErrorMessage] = useState(paramError);
  const [message, setMessage] = useState(paramMessage);

  return (
    <>
    { errorMessage && (
      <div className="max-w-3xl mx-auto mb-8 bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
        <button
          onClick={() => setErrorMessage(null)}
          className="text-white hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )}
    </>
  );
}

const PricingPage = () => {
  const router = useRouter();
  const { user, systemData, loading } = useUserData();
  const [currentPlan, setCurrentPlan] = useState('Free');

  const [isProcessing, setIsProcessing] = useState(false);

  // Update current plan based on user data
  useEffect(() => {
    if (systemData?.subscription_tier) {
      if (systemData?.subscription_tier === 'Basic Plan') {
        setCurrentPlan('Basic');
      } else if (systemData?.subscription_tier === 'Premium Plan') {
        setCurrentPlan('Premium');
      }
    }
  }, [user]);

  const handleSubscribe = async (planName: string) => {
    // Check if user is logged in
    if (!user && !loading) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please sign in to purchase a subscription',
        color: 'blue',
      });
      router.push('/auth');
      return;
    }

    // If still loading user data, show loading notification
    if (loading) {
      notifications.show({
        title: 'Loading',
        message: 'Please wait while we verify your account',
        loading: true,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const tier = pricingPlans.find((p) => p.name === planName)?.planName;

      if (!tier) {
        throw new Error(`Invalid plan: ${planName}`);
      }

      // Show processing notification
      const notificationId = notifications.show({
        title: 'Processing Payment',
        message: 'Creating your invoice, please wait...',
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });

      // Create form data to pass to the server action
      const formData = new FormData();
      formData.append('tier', tier);

      // Call the server action which will handle the redirect
      await createInvoiceAndRedirect(formData);

      // If we get here without redirecting, close the notification
      notifications.update({
        id: notificationId,
        title: 'Redirecting',
        message: 'Taking you to the payment page...',
        loading: true,
      });

    } catch (error: any) {
      setIsProcessing(false);
      console.error('Payment error:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process payment request',
        color: 'red',
      });
    }
  };

  return (
    <div className="py-16 px-6 lg:px-20 bg-black text-white min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6">Pricing</h1>
        <p className="text-xl max-w-3xl mx-auto">
          Unlimited creativity at amazing prices. Try FantazyPro for free or purchase a pack for more tokens and features.
        </p>
      </div>

      <Suspense>
        <PricingPageMessageBox />
      </Suspense>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
          {pricingPlans.map((plan) => {
            const isCurrent = currentPlan === plan.name;

            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col h-full ${plan.highlight
                  ? 'border-2 border-indigo-500'
                  : 'border border-gray-800'
                  }`}
                style={{
                  background: 'linear-gradient(80.42deg, rgba(0, 0, 0, 0.16) 25.25%, rgba(83, 84, 108, 0.16) 98.05%)',
                }}
              >
                <div className="mb-6">
                  <Group align='start' justify='space-between'>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {/* {plan.bestValue && (
                      <div className="text-sm bg-indigo-600 text-white font-medium rounded-full px-4 py-1 inline-block mb-3">
                        Best Value
                      </div>
                    )} */}
                    {plan.popular && (
                      <div className="text-sm bg-indigo-600 text-white font-medium rounded-full px-4 py-1 inline-block mb-3">
                        Popular
                      </div>
                    )}
                  </Group>
                  <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.tagline && <span className="ml-2 text-gray-400">{plan.tagline}</span>}
                  </div>
                </div>

                <button
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`py-3 px-4 rounded-3xl font-medium mb-6 ${isCurrent || isProcessing
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-white text-blue-700 hover:bg-gray-200 cursor-pointer'
                    }`}
                >
                  {isCurrent
                    ? 'Current plan'
                    : isProcessing
                      ? 'Processing...'
                      : 'Purchase'}
                </button>

                <div className="text-sm text-gray-300 mb-6">
                  <div>{plan.tokens}</div>
                  <div>{plan.images}</div>
                </div>

                <ul className="space-y-3 text-sm flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      {feature.available ? (
                        <IconCheck size={18} className="text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <IconX size={18} className="text-red-500 mr-2 flex-shrink-0" />
                      )}
                      <span className={feature.available ? 'text-gray-200' : 'text-gray-500'}>
                        {feature.name}
                        {" "}
                        {feature.explanation && feature.available && (
                          <HoverCard width={280} shadow="md">
                            <HoverCard.Target>
                              <IconInfoCircle size={16} className="inline" />
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                              <Text size="sm">
                                {feature.explanation}
                              </Text>
                            </HoverCard.Dropdown>
                          </HoverCard>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="mt-16 text-center">
        <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full px-6 py-2 mb-8">
          🎬 Video Generation Coming Soon
        </div>
      </div>

      {/* LoRa Training Section */}
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="rounded-2xl p-8 border border-gray-800" style={{
          background: 'linear-gradient(80.42deg, rgba(0, 0, 0, 0.16) 25.25%, rgba(83, 84, 108, 0.16) 98.05%)',
        }}>
          <h2 className="text-3xl font-bold text-center mb-6">LoRa Character Training</h2>
          <p className="text-gray-300 text-center mb-8">
            Train custom AI models for your characters with our professional LoRa training service
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-4xl font-bold text-indigo-400 mb-2">$60</div>
              <div className="text-gray-300">Per single LoRa character training</div>
            </div>
            
            <div className="text-center p-4">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-gray-300">Sell your trained LoRa models and earn revenue</div>
            </div>
            
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-gray-300">Bulk buy training credits with exclusive discounts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;