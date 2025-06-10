'use client'

import { useRouter } from "next/navigation";
import { Text, Title, Button, Container } from '@mantine/core';
import classes from './page.module.css';
import Link from "next/link";
import { IconArrowNarrowRight, IconBrandTelegram, IconClick, IconStar, IconTarget } from "@tabler/icons-react";
import { Header } from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useEffect, useState } from "react";

function BackgroundImageCarousel() {
  const images = [
    '/landing/slides/3.webp',
    '/landing/slides/1.webp',
    '/landing/slides/2.webp',
    '/landing/slides/4.webp',
    '/landing/slides/5.webp',
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((image, index) => {
        const isActive = index === currentImageIndex;
        const isPrevious = index === (currentImageIndex - 1 + images.length) % images.length;
        
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out`}
            style={{
              zIndex: isActive ? 2 : isPrevious ? 1 : 0,
              transitionProperty: 'opacity, scale',
              opacity: isActive? 1 : 0,
              scale: isActive? 1 : 1.2,
            }}
          >
            <img
              src={image}
              alt={`Background ${index + 1}`}
              className="w-full h-full object-cover object-top"
            />
          </div>
        );
      })}
    </div>
  );
}

interface CharacterCardData {
  id?: string;
  name: string;
  image: string;
}

function CharacterCard(character: CharacterCardData) {
  return (
    <div className="flex flex-col">
      <div className="aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden mb-3">
        <img
          src={character.image}
          alt="Tech Reviewer"
          className="w-full h-full object-cover"
        />
      </div>
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-3xl transition w-full">
        <span className="text-lg font-bold">{character.name}</span>
      </button>
    </div>
  )
}

export default function Home() {
  const router = useRouter();

  // Comment out the automatic redirect to allow viewing this landing page
  // useEffect(() => {
  //   router.push("/create");
  // }, []);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Navigation */}
        <div className="absolute inset-0 z-10">
          <Header></Header>
        </div>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10"></div>
          <BackgroundImageCarousel />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row h-screen">
          {/* Left Column - Text */}
          <div className="md:w-5xl flex flex-col justify-center px-8 md:pl-16 pt-24 md:pt-0">
            <h1 className="text-5xl md:text-8xl font-bold mb-6">
              Bring a<br />fantasy<br />to life.
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-md">
              Dream up high-quality characters to build your fanbase and start earning 💸
            </p>
            <div>
              <button
                onClick={() => router.push("/auth")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full transition cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Right Column - Image (on larger screens) */}
          <div className="md:w-1/2 hidden md:block">
            {/* This space is for the image that's already in the background */}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <div className="text-indigo-500 mb-4">
                <IconClick size={48} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Incredibly<br />Easy to use</h3>
              <p className="text-gray-300">
                Craft stunning characters with our cutting-edge user-friendly diffusion tech for flawless, vivid images.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <div className="text-indigo-500 mb-4">
                <IconStar size={48} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Breathtaking<br />Quality</h3>
              <p className="text-gray-300">
                Start with easy templates, traits, and prompts to control every detail of your character's look.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
              <div className="text-indigo-500 mb-4">
                <IconTarget size={48} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Unparalleled<br />accuracy</h3>
              <p className="text-gray-300">
                Create engaging poses that deepen your character's story and draw fans in with every frame.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Try It Now Section */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold mb-6">Try it now</h2>
          <p className="text-xl text-gray-300 mb-12">
            Use our simple character builder below and see just how easy it is!
          </p>

          {/* Character Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <CharacterCard name="Fashion Model" image="/character/fashion_model.png"></CharacterCard>
            <CharacterCard name="Wellness Coach" image="/character/wellness_coach.png"></CharacterCard>
            <CharacterCard name="NSFW Model" image="/character/NSFW_model.png"></CharacterCard>
            <CharacterCard name="Travel Blogger" image="/character/travel_blogger.png"></CharacterCard>

            <CharacterCard name="Tech Reviewer" image="/character/tech_reviewer.png"></CharacterCard>
            <CharacterCard name="Fitness Model" image="/character/fitness_model.png"></CharacterCard>
            <CharacterCard name="Chef" image="/character/chef.png"></CharacterCard>
            <CharacterCard name="Musician/DJ" image="/character/dj.png"></CharacterCard>
          </div>
        </div>
      </div>

      {/* Discover Section */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Text
            component="span"
            className="text-6xl md:text-5xl font-bold mb-4"
            variant="gradient"
            gradient={{ from: 'indigo', to: 'violet' }}
            fz={40}
            fw={600}
          >
            Discover
          </Text>
          <h3 className="text-4xl md:text-7xl font-bold mb-6">
            500k+ Creations per Month
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            What are our users creating?
          </p>

          <div className="flex justify-center mb-16">
            <Link href="/gallery" className="flex items-center text-lg text-indigo-400 hover:text-indigo-300 transition">
              View all
              <IconArrowNarrowRight size={20} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Join Community Section */}
      <div className="bg-black py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-12">
            Join our fast growing community
          </h2>

          <div className="flex justify-center">
            <a
              href="https://t.me/influencergen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-medium transition"
            >
              <IconBrandTelegram className="mr-2"></IconBrandTelegram>
              Join us on Telegram
            </a>
          </div>
        </div>
      </div>

      <Footer></Footer>
    </div>
  );
}