'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Box, Text, Title } from '@mantine/core';
import classes from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Comment out the automatic redirect to allow viewing this landing page
  // useEffect(() => {
  //   router.push("/generate-images");
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Fixed navbar */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center py-4 px-8 border-b bg-white z-20">
        <div className="flex items-center">
          <Text
            component="span"
            inherit
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            fw="bolder"
            fz={20}
          >
            InfluencerGEN
          </Text>
        </div>
        <div>
          <button
            className="px-4 py-2 rounded-full border border-gray-300 font-medium text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white hover:border-transparent transition-all cursor-pointer"
            onClick={() => router.push("/auth")}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Main content container */}
      <div className="flex flex-col md:flex-row min-h-screen pt-16">
        {/* Fixed left column - Text content */}
        <div className="md:w-1/2 fixed left-0 top-16 bottom-0 px-8 py-12 flex flex-col justify-center z-10">
          <div className={classes.titleContainer}>
            <Title className={classes.title} mb={10}>
              Turn your Ideas into{' '}
              <Text
                component="span"
                inherit
                variant="gradient"
                gradient={{ from: 'pink', to: 'yellow' }}
              >
                stunning visuals
              </Text>{' '}
              with AI
            </Title>
            <p className="text-gray-600 mb-8">
              Describe anything you imagine, and let our AI bring it to life in breathtaking, high-quality images.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-black text-white rounded-full font-medium cursor-pointer" onClick={() => router.push("/auth")}>
                Start Creating
              </button>
              <button
                className="px-4 py-2 rounded-full border border-gray-300 font-medium text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white hover:border-transparent transition-all cursor-pointer"
                onClick={() => router.push("/auth")}
              >
                Explore Gallery
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable right column - Image grid */}
        <div className="md:w-1/2 md:ml-[50%] mt-8 md:mt-0 relative min-h-screen overflow-y-auto px-8 py-5">

          <div className="grid grid-cols-2 gap-4">
            {/* Left column - staggered down */}
            <div className="space-y-4 mt-12">
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/1.png"
                  alt="AI Generated Portrait"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/3.png"
                  alt="AI Generated Landscape"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/5.jpeg"
                  alt="AI Generated Product"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Add more images to ensure scrolling */}
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/1.png"
                  alt="Additional Image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/2.jpeg"
                  alt="AI Generated Scene"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/4.jpeg"
                  alt="AI Generated Character"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/6.jpeg"
                  alt="AI Generated Concept"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Add more images to ensure scrolling */}
              <div className="rounded-lg overflow-hidden bg-gray-200 relative">
                <img
                  src="/landing/2.jpeg"
                  alt="Additional Image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}