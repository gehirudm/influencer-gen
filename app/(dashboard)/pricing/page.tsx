"use client"

import { Group, HoverCard, Stack, Text } from '@mantine/core';
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import React, { useState } from 'react';

const pricingPlans: {
    name: string;
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
    price: '$0',
    tagline: '',
    tokens: '50 tokens',
    images: 'create up to 25 images',
    features: [
      { name: 'Simple image generation', explanation: "Generate realistic images easily without the need of complex prompts with a pre-defined set of features handcrafted for optimal image generation.", available: true },
      { name: 'Advanced image generation', explanation: "Full control over image generation parameters including negative prompts, dimensions, and other advanced settings.", available: true },
      { name: 'Character creation', explanation: "Create and customize your own characters with detailed appearance settings.", available: true },
      { name: 'Img2Img generation', explanation: "Transform existing images using AI by providing a base image and modifying it with prompts.", available: true },
      { name: '2 hyper realistic models', explanation: "Access to two high-quality AI models optimized for photorealistic image generation.", available: true },
      { name: 'No watermark on images', explanation: "Download and use images without any watermarks or branding.", available: false },
      { name: 'Nudify', explanation: "Generate tasteful artistic nude content with our specialized model.", available: false },
      { name: 'Character training with Character Engine', explanation: "Train AI to mimic your character's personality and speech patterns for interactive conversations.", available: false },
      { name: 'Image Generation with Character Engine', explanation: "Generate images that match your character's specific appearance and style consistently.", available: false },
    ],
    button: 'Current plan',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '$39.99',
    tagline: 'One time fee',
    tokens: '1000 tokens',
    images: 'Create up to 750 images',
    features: [
      { name: 'All image generation features', explanation: "Full access all image generation features available.", available: true },
      { name: 'Character creation', explanation: "Create and customize your own characters with detailed appearance settings and save them for future use.", available: true },
      { name: 'Img2Img generation', explanation: "Transform existing images using AI by providing a base image and modifying it with prompts for precise results.", available: true },
      { name: '2 hyper realistic models', explanation: "Access to two premium AI models specifically tuned for photorealistic image generation with exceptional quality.", available: true },
      { name: 'No watermark on images', explanation: "All generated images are delivered without watermarks for professional use and sharing.", available: true },
      { name: 'Nudify', explanation: "Upload an image and generate a nude version of that image. You can tweak the characteristics to your choice", available: true },
      { name: 'Character training with Character Engine', explanation: "Train AI to learn your character, resulting in much higher quality similarity in ", available: true },
      { name: 'Image Generation with Character Engine', explanation: "Generate consistent images of your trained characters with perfect appearance matching across multiple generations.", available: true },
    ],
    button: 'Purchase',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$64.99',
    tagline: 'One time fee',
    tokens: '10000 tokens',
    images: 'Create up to 3000 images',
    features: [
      { name: 'All image generation features', explanation: "Full access all image generation features available.", available: true },
      { name: 'Character creation', explanation: "Create unlimited characters with our most detailed customization options and advanced appearance settings.", available: true },
      { name: 'Img2Img generation', explanation: "Transform existing images with our most powerful AI models, offering precise control over the transformation process.", available: true },
      { name: '2 hyper realistic models', explanation: "Access to our highest quality AI models with enhanced photorealism and superior detail rendering.", available: true },
      { name: 'No watermark on images', explanation: "All generated images are delivered without watermarks and at maximum available resolution.", available: true },
      { name: 'Nudify', explanation: "Upload an image and generate a nude version of that image. You can tweak the characteristics to your choice", available: true },
      { name: 'Character training with Character Engine', explanation: "Train multiple AI characters with our most sophisticated learning algorithms for incredibly realistic conversations.", available: true },
      { name: 'Image Generation with Character Engine', explanation: "Generate the highest quality consistent images of your trained characters with perfect appearance matching and enhanced details.", available: true },
    ],
    button: 'Purchase',
    highlight: true,
    popular: true,
  },
  // {
  //   name: 'Master',
  //   price: '$59',
  //   tagline: 'One time fee',
  //   tokens: '24000 tokens',
  //   images: 'Create up to 6000 images',
  //   features: [
  //     { name: 'AI Image generator', available: true },
  //     { name: 'Character creation', available: true },
  //     { name: 'Img2Img generation', available: true },
  //     { name: '5 hyper realistic models', available: true },
  //     { name: 'No watermark on images', available: true },
  //     { name: 'Upscale images to Hi-Res', available: true },
  //     { name: 'Face swap video', available: true },
  //   ],
  //   button: 'Purchase',
  //   highlight: false,
  //   bestValue: true,
  // },
];

const PricingPage = () => {
  const [currentPlan] = useState('Free');

  const handleSubscribe = async (planName: string) => {
    console.log(`Redirecting to payment for: ${planName}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.href = `/payment?plan=${planName.toLowerCase()}`;
  };

  return (
    <div className="py-16 px-6 lg:px-20 bg-black text-white min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6">Pricing</h1>
        <p className="text-xl max-w-3xl mx-auto">
          Unlimited creativity at amazing prices. Try Genfluence for free or purchase a pack for more tokens and features.
        </p>
      </div>

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
                  disabled={isCurrent}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`py-3 px-4 rounded-3xl font-medium mb-6 ${isCurrent
                    ? 'bg-gray-700  cursor-not-allowed'
                    : 'bg-white text-blue-700 hover:bg-gray-200'
                    }`}
                >
                  {isCurrent ? 'Current plan' : 'Purchase'}
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
    </div>
  );
};

export default PricingPage;