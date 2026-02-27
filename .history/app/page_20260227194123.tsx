'use client'

import { useRouter } from "next/navigation";
import { Text, Accordion } from '@mantine/core';
import Link from "next/link";
import { 
  IconArrowNarrowRight, 
  IconBrandTelegram, 
  IconClick, 
  IconStar, 
  IconTarget,
  IconUsers,
  IconWand,
  IconCamera,
  IconPalette,
  IconBolt,
  IconShieldCheck,
  IconInfinity,
  IconSparkles,
  IconRocket,
  IconCoins,
  IconChevronDown,
  IconCrown
} from "@tabler/icons-react";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
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

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">

      {/* SECTION 1: Hero Section */}
      <div className="relative min-h-screen bg-black overflow-x-clip">
        {/* Navigation */}
        <div className="absolute inset-0 z-20 h-30">
          <Header></Header>
        </div>

        {/* Angled Images - Left Side */}
        <div className="absolute left-[18%] top-1/2 -translate-y-1/2 z-0 hidden lg:block">
          <div className="relative w-64 h-[450px]">
            {/* Top Left Image */}
            <Link href="/generate" className="absolute top-0 left-0 w-48 h-64 z-10" style={{ transform: 'rotate(-12deg) translateY(0px)' }}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer group">
                <img
                  src="/landing/slides/1.webp"
                  alt="Generate Images"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div className="text-white font-bold text-sm">Generate Images</div>
                  <div className="text-indigo-400 text-xs flex items-center mt-1">
                    Learn more <IconArrowNarrowRight size={12} className="ml-1" />
                  </div>
                </div>
              </div>
            </Link>
            {/* Bottom Left Image */}
            <Link href="/undress" className="absolute top-48 left-0 w-48 h-64 z-0" style={{ transform: 'rotate(8deg) translateY(0px)' }}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer group">
                <img
                  src="/landing/slides/2.webp"
                  alt="Undress AI"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div className="text-white font-bold text-sm">Undress AI</div>
                  <div className="text-indigo-400 text-xs flex items-center mt-1">
                    Learn more <IconArrowNarrowRight size={12} className="ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Angled Images - Right Side */}
        <div className="absolute right-[18%] top-1/2 -translate-y-1/2 z-0 hidden lg:block">
          <div className="relative w-64 h-[450px]">
            {/* Top Right Image */}
            <Link href="/characters" className="absolute top-0 right-0 w-48 h-64 z-10" style={{ transform: 'rotate(12deg) translateY(0px)' }}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer group">
                <img
                  src="/landing/slides/3.webp"
                  alt="Own Character"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div className="text-white font-bold text-sm">Own Character</div>
                  <div className="text-indigo-400 text-xs flex items-center mt-1">
                    Learn more <IconArrowNarrowRight size={12} className="ml-1" />
                  </div>
                </div>
              </div>
            </Link>
            {/* Bottom Right Image */}
            <Link href="/marketplace" className="absolute top-48 right-0 w-48 h-64 z-0" style={{ transform: 'rotate(-8deg) translateY(0px)' }}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer group">
                <img
                  src="/landing/slides/4.webp"
                  alt="Marketplace"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div className="text-white font-bold text-sm">Marketplace</div>
                  <div className="text-indigo-400 text-xs flex items-center mt-1">
                    Learn more <IconArrowNarrowRight size={12} className="ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Hero Content - Centered */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center px-8 pt-24 md:pt-0 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]">
              <div className="text-white">
                Bring Your
              </div>
              <div>
                <Text
                  component="span"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'violet' }}
                  inherit
                >
                  Fantazy
                </Text>
                <span className="text-white"> to Life</span>
              </div>
            </h1>
            <p className="text-base md:text-lg mb-4 text-gray-200">
              Create Anything. No Limits. No Censored. No Bullshit.
            </p>
            <p className="text-sm md:text-base mb-8 text-gray-400 max-w-xl mx-auto">
              Unleash your creativity with AI-powered image generation. Build characters, generate stunning visuals, and bring your wildest ideas to reality.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={() => router.push("/auth")}
                className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-violet-700 text-white px-8 py-3 rounded-full text-base font-semibold transition cursor-pointer shadow-lg shadow-indigo-500/50"
              >
                Start Free
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white px-8 py-3 rounded-full text-base font-semibold transition cursor-pointer"
              >
                View Pricing
              </button>
            </div>

            {/* Mobile Image Cards - Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto mt-8 pb-2 lg:hidden snap-x snap-mandatory -mx-8 px-4" style={{ scrollbarWidth: 'none' }}>
              {[
                { src: '/landing/slides/1.webp', name: 'Generate Images', href: '/generate' },
                { src: '/landing/slides/2.webp', name: 'Undress AI', href: '/undress' },
                { src: '/landing/slides/3.webp', name: 'Own Character', href: '/characters' },
                { src: '/landing/slides/4.webp', name: 'Marketplace', href: '/marketplace' },
              ].map((card) => (
                <Link key={card.href} href={card.href} className="flex-none snap-center">
                  <div className="relative w-36 h-52 rounded-2xl overflow-hidden shadow-2xl cursor-pointer">
                    <img src={card.src} alt={card.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <div className="text-white font-bold text-sm">{card.name}</div>
                      <div className="text-indigo-400 text-xs flex items-center mt-1">
                        Learn more <IconArrowNarrowRight size={12} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Down Arrow */}
        <div className="absolute bottom-12 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div
            className="animate-bounce pointer-events-auto cursor-pointer"
            onClick={() => {
              const nextSection = document.getElementById('pick-your-tool');
              nextSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <IconChevronDown size={32} className="text-white" stroke={2.5} />
          </div>
        </div>
      </div>

      {/* SECTION 2: Pick Your Tool */}
      <div id="pick-your-tool" className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
              className="text-lg font-semibold uppercase tracking-wider"
            >
              Pick Your Tool
            </Text>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-base text-gray-400 max-w-3xl mx-auto">
              From character creation to image generation, we've got all the tools you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Tool 1: Create Character */}
            <div 
              onClick={() => router.push("/characters")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105 cursor-pointer group relative min-h-[400px]"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconUsers size={120} className="text-indigo-400/30 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold mb-2">Create Your Dream Character</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Build custom characters with detailed appearance settings
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-semibold">
                  Learn more <IconArrowNarrowRight size={16} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Tool 2: Undress Tool */}
            <div 
              onClick={() => router.push("/undress")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105 cursor-pointer group relative min-h-[400px]"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconWand size={120} className="text-violet-400/30 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold mb-2">Undress Tool</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Advanced AI technology to transform images
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-semibold">
                  Learn more <IconArrowNarrowRight size={16} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Tool 3: Create Images */}
            <div 
              onClick={() => router.push("/generate-images")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105 cursor-pointer group relative min-h-[400px]"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconCamera size={120} className="text-indigo-400/30 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold mb-2">Create Images</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Generate stunning images from text prompts
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-semibold">
                  Learn more <IconArrowNarrowRight size={16} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Tool 4: Image Inpainting */}
            <div 
              onClick={() => router.push("/generate-images")}
              className="backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105 cursor-pointer group relative min-h-[400px]"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconPalette size={120} className="text-violet-400/30 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="text-xl font-bold mb-2">Image Inpainting</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Edit and refine images with precision
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-semibold">
                  Learn more <IconArrowNarrowRight size={16} className="ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Features */}
      <div className="bg-black py-20 relative">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-45">
          <img
            src="/landing/slides/1.webp"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
              className="text-lg font-semibold uppercase tracking-wider"
            >
              Features
            </Text>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              Why Choose Fantazy?
            </h2>
            <p className="text-base text-gray-400 max-w-3xl mx-auto">
              Powerful features designed for creators who demand the best
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Feature 1 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-indigo-400 mb-3">
                <IconCamera size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">Reference Images</h3>
              <p className="text-gray-400">
                Upload reference images to guide the AI and create exactly what you envision with precision and consistency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-violet-400 mb-3">
                <IconStar size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">Model Marketplace</h3>
              <p className="text-gray-400">
                Access thousands of pre-trained AI models. From celebrities to custom styles, find the perfect model for your creation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-indigo-400 mb-3">
                <IconShieldCheck size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">100% Uncensored</h3>
              <p className="text-gray-400">
                No limits, no restrictions. Create any content you want without censorship or judgment. Your creativity, your rules.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-violet-400 mb-3">
                <IconBolt size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">Instant Results</h3>
              <p className="text-gray-400">
                Fast generation times mean you spend less time waiting and more time creating. Get results in seconds, not minutes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-indigo-400 mb-3">
                <IconSparkles size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">HD Quality</h3>
              <p className="text-gray-400">
                Generate images in stunning high definition with incredible detail and clarity. Professional quality every time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 md:p-8 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition">
              <div className="text-violet-400 mb-3">
                <IconInfinity size={32} className="md:w-12 md:h-12" />
              </div>
              <h3 className="text-base md:text-2xl font-bold mb-2 md:mb-4">Unlimited Creativity</h3>
              <p className="text-gray-400">
                No creative boundaries. Generate as much as you want with our flexible token system. Scale as you grow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: See What's Possible */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
              className="text-lg font-semibold uppercase tracking-wider"
            >
              Gallery
            </Text>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              See What's Possible
            </h2>
            <p className="text-base text-gray-400 max-w-3xl mx-auto">
              Real creations from our community. Your imagination is the only limit.
            </p>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {/* Dummy Image Cards */}
            {[
              { name: "Mirror Selfie" },
              { name: "Blowjob" },
              { name: "Spiderman Bodysuit" },
              { name: "Beach Photoshoot" },
              { name: "Yoga Pose" },
              { name: "Lingerie Model" },
              { name: "Cosplay Character" },
              { name: "Fashion Editorial" }
            ].map((item, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[3/4] backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden relative hover:border-indigo-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center">
                    <div className="text-center p-4">
                      <IconCamera size={48} className="mx-auto mb-2 text-indigo-400/60" />
                      <p className="text-white/80 font-semibold">{item.name}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-indigo-500/10 transition-all"></div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push("/pricing")}
              className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-violet-700 text-white px-6 py-2.5 rounded-full text-base font-semibold transition shadow-lg shadow-indigo-500/50"
            >
              See Pricing
            </button>
            <button
              onClick={() => router.push("/marketplace")}
              className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white px-6 py-2.5 rounded-full text-base font-semibold transition"
            >
              Explore Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 5: Pay As You Grow - Pricing */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
              className="text-lg font-semibold uppercase tracking-wider"
            >
              Pricing
            </Text>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              Pay As You Grow
            </h2>
            <p className="text-base text-gray-400 max-w-3xl mx-auto">
              Start free with 1,000 credits. Upgrade when you're ready.
            </p>
          </div>

          {/* Free Plan Highlight */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="backdrop-blur-xl bg-white/5 border-2 border-indigo-500/50 rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <IconRocket size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Start 100% Free</h3>
              <p className="text-3xl font-bold text-indigo-400 mb-4">1,000 Free Credits</p>
              <p className="text-gray-300 text-lg mb-6">
                No credit card required. Start creating immediately with full access to all features.
              </p>
              <button
                onClick={() => router.push("/auth")}
                className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-violet-700 text-white px-8 py-3 rounded-full text-base font-semibold transition shadow-lg shadow-indigo-500/50"
              >
                Claim Your Free Credits
              </button>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* Basic Plan */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-indigo-500/50 transition">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Basic Plan</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$39.99</span>
                  <span className="text-gray-400">one time</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <IconCoins size={18} className="text-indigo-400" />
                  <span className="text-base font-semibold">1,000 Tokens</span>
                </div>
                <div className="flex items-center gap-3">
                  <IconSparkles size={18} className="text-violet-400" />
                  <span className="text-base font-semibold">1 LoRA Token</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <IconCamera size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">All image generation features</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconWand size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">AI Undress tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconUsers size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">Character creation</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconSparkles size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">1 LoRA character training</span>
                </li>
              </ul>

              <button
                onClick={() => router.push("/pricing")}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-3 rounded-xl text-base font-semibold transition"
              >
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl p-8 border-2 border-indigo-500/50 hover:border-indigo-400 transition relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <IconCrown size={16} />
                  POPULAR
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Premium Plan</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$64.99</span>
                  <span className="text-gray-400">one time</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <IconCoins size={18} className="text-indigo-400" />
                  <span className="text-base font-semibold">10,000 Tokens</span>
                </div>
                <div className="flex items-center gap-3">
                  <IconSparkles size={18} className="text-violet-400" />
                  <span className="text-base font-semibold">2 LoRA Tokens</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <IconCamera size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">All image generation features</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconWand size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">AI Undress tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconUsers size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">Unlimited characters</span>
                </li>
                <li className="flex items-start gap-3">
                  <IconSparkles size={18} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">2 LoRA character trainings</span>
                </li>
              </ul>

              <button
                onClick={() => router.push("/pricing")}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-3 rounded-xl text-base font-semibold transition"
              >
                Get Premium
              </button>
            </div>
          </div>

          {/* View Full Pricing Link */}
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center text-lg text-indigo-400 hover:text-indigo-300 transition">
              View Full Pricing & Token Packs
              <IconArrowNarrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-black py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-base text-gray-400 mb-8">
            Connect with other creators, get support, and stay updated with the latest features
          </p>

          <div className="flex justify-center">
            <a
              href="https://t.me/FantazyPro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-6 py-2.5 rounded-full font-semibold transition"
            >
              <IconBrandTelegram size={20} className="mr-2" />
              Join us on Telegram
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 6: FAQ */}
      <div className="bg-black py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
              className="text-lg font-semibold uppercase tracking-wider"
            >
              FAQ
            </Text>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-gray-400">
              Everything you need to know about Fantazy
            </p>
          </div>

          <div className="space-y-6">
            <Accordion
              classNames={{
                item: "backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4",
                control: "hover:bg-white/10 text-white font-semibold text-lg p-6",
                content: "text-gray-400 p-6 pt-0",
                chevron: "text-indigo-400"
              }}
              chevron={<IconChevronDown size={24} />}
            >
              <Accordion.Item value="faq-1">
                <Accordion.Control>How do I get started?</Accordion.Control>
                <Accordion.Panel>
                  Simply sign up for a free account and you'll receive 1,000 free credits to start creating immediately. No credit card required.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="faq-2">
                <Accordion.Control>Is the content really uncensored?</Accordion.Control>
                <Accordion.Panel>
                  Yes! We don't impose artificial limits on creativity. You have complete freedom to create any content you want with no censorship or restrictions.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="faq-3">
                <Accordion.Control>Do tokens expire?</Accordion.Control>
                <Accordion.Panel>
                  No, tokens never expire. Purchase once and use them whenever you want. There are no monthly fees or subscriptions.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="faq-4">
                <Accordion.Control>What is a LoRA token?</Accordion.Control>
                <Accordion.Panel>
                  LoRA tokens allow you to train custom AI models of specific characters or styles. This ensures consistent, high-quality generations that match your exact vision every time.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="faq-5">
                <Accordion.Control>How fast are image generations?</Accordion.Control>
                <Accordion.Panel>
                  Most images are generated in just a few seconds. Complex generations may take slightly longer, but you'll never wait more than a minute.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="faq-6">
                <Accordion.Control>Can I use the images commercially?</Accordion.Control>
                <Accordion.Panel>
                  Yes! All images you generate belong to you and can be used for any purpose, including commercial use.
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>

          <div className="text-center mt-12">
            <Link href="/about/faq" className="inline-flex items-center text-lg text-indigo-400 hover:text-indigo-300 transition">
              View All FAQs
              <IconArrowNarrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />

    </div>
  );
}