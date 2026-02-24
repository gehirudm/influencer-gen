"use client"

import { PaymentModal } from '@/components/PaymentModal/PaymentModal';
import { useUserData } from '@/hooks/useUserData';
import { Group, HoverCard, Stack, Text, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconInfoCircle,
  IconSparkles,
  IconCoins,
  IconBolt,
  IconDiscount2,
  IconStar,
  IconBrush,
  IconCamera,
  IconWand,
  IconShieldCheck,
  IconUsers,
  IconCrown,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';
import React, { Suspense, useState } from 'react';

// Plan definitions
const plans = [
  {
    id: 'basic_plan',
    name: 'Basic',
    price: '$39.99',
    tagline: 'One time fee',
    tokens: '1,000 Tokens',
    loraTokens: '1 LoRA Token',
    features: [
      { name: 'All image generation features', icon: IconCamera, explanation: "Full access to simple, advanced, img2img, and nudify generation modes." },
      { name: 'AI Undress', icon: IconWand, explanation: "Upload an image and generate a nude version with full customization." },
      { name: 'Character creation', icon: IconUsers, explanation: "Create and customize your own characters with detailed appearance settings." },
      { name: '1 LoRA character training', icon: IconSparkles, explanation: "Train one custom LoRA model for consistent high-quality character generations." },
      { name: 'Character Engine generation', icon: IconBrush, explanation: "Generate images matching your character's specific appearance consistently." },
    ],
    highlight: false,
  },
  {
    id: 'premium_plan',
    name: 'Premium',
    price: '$64.99',
    tagline: 'One time fee',
    tokens: '10,000 Tokens',
    loraTokens: '2 LoRA Tokens',
    popular: true,
    features: [
      { name: 'All image generation features', icon: IconCamera, explanation: "Full access to all image generation features." },
      { name: 'AI Undress', icon: IconWand, explanation: "Upload an image and generate a nude version with full customization." },
      { name: 'Character creation', icon: IconUsers, explanation: "Create unlimited characters with detailed customization." },
      { name: '2 LoRA character trainings', icon: IconSparkles, explanation: "Train two custom LoRA models for consistent character generations." },
      { name: 'Character Engine generation', icon: IconBrush, explanation: "Generate the highest quality consistent character images." },
    ],
    highlight: true,
  },
];

// Token packs
const tokenPacks = [
  { id: 'tokens_1000', amount: '1,000', price: '$10', pricePerToken: '$0.010', discount: null },
  { id: 'tokens_2000', amount: '2,000', price: '$18', pricePerToken: '$0.009', discount: '10% off' },
  { id: 'tokens_5000', amount: '5,000', price: '$40', pricePerToken: '$0.008', discount: '20% off' },
  { id: 'tokens_10000', amount: '10,000', price: '$70', pricePerToken: '$0.007', discount: '30% off' },
];

// LoRA token packs
const loraTokenPacks = [
  { id: 'lora_1', amount: '1', price: '$60', perUnit: '$60/token', discount: null },
  { id: 'lora_2', amount: '2', price: '$108', perUnit: '$54/token', discount: '10% off' },
  { id: 'lora_3', amount: '3', price: '$144', perUnit: '$48/token', discount: '20% off' },
  { id: 'lora_5', amount: '5', price: '$210', perUnit: '$42/token', discount: '30% off' },
];

function PricingPageMessageBox() {
  const searchParams = useSearchParams()
  const paramError = searchParams.get('error');

  const [errorMessage, setErrorMessage] = useState(paramError);

  if (!errorMessage) return null;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto 32px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#fca5a5',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconInfoCircle size={18} />
        <span style={{ fontSize: '14px' }}>{errorMessage}</span>
      </div>
      <button
        onClick={() => setErrorMessage(null)}
        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px' }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

const PricingPage = () => {
  const router = useRouter();
  const { user, systemData, loading } = useUserData();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isPaidCustomer = systemData?.isPaidCustomer || false;

  // Payment modal state
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; price: string } | null>(null);

  const handlePurchase = (productId: string, productName: string, price: string) => {
    if (!user && !loading) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please sign in to make a purchase',
        color: 'blue',
      });
      router.push('/auth');
      return;
    }

    if (loading) {
      notifications.show({
        title: 'Loading',
        message: 'Please wait while we verify your account',
        loading: true,
      });
      return;
    }

    setSelectedProduct({ id: productId, name: productName, price });
    setModalOpened(true);
  };

  return (
    <div style={{ padding: isMobile ? '24px 12px' : '24px 24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.3, padding: '4px 0', background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Pricing
        </h1>
        <p style={{ fontSize: '18px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto' }}>
          Unlock unlimited creativity. Purchase a plan for full access or buy tokens individually.
        </p>

        {/* User Balance Display */}
        {user && systemData && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}>
              <IconCoins size={16} color="#818cf8" />
              <span style={{ fontSize: '14px', color: '#c7d2fe' }}>{systemData.tokens.toLocaleString()} Tokens</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              <IconSparkles size={16} color="#a78bfa" />
              <span style={{ fontSize: '14px', color: '#ddd6fe' }}>{systemData.loraTokens} LoRA Tokens</span>
            </div>
            {isPaidCustomer && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}>
                <IconShieldCheck size={16} color="#4ade80" />
                <span style={{ fontSize: '14px', color: '#bbf7d0' }}>Paid Customer</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Suspense>
        <PricingPageMessageBox />
      </Suspense>

      {/* ============ SECTION 1: STARTER PLANS ============ */}
      <div style={{ maxWidth: '900px', margin: '0 auto 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconCrown size={20} color="#a78bfa" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Starter Plans</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', lineHeight: isMobile ? 1.3 : undefined }}>Get Started with Full Access</h2>
          <p style={{ color: '#9ca3af' }}>Any purchase unlocks all features — choose the plan that fits your needs</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                borderRadius: '16px',
                padding: '32px',
                background: 'linear-gradient(160deg, rgba(17, 17, 30, 0.9) 0%, rgba(30, 30, 50, 0.6) 100%)',
                border: plan.highlight ? '2px solid #6366f1' : '1px solid #333',
                position: 'relative',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = plan.highlight ? '#6366f1' : '#333';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 16px',
                  borderRadius: '999px',
                }}>
                  Popular
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 700 }}>{plan.price}</span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>{plan.tagline}</span>
                </div>
              </div>

              {/* What you get */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '13px',
                  color: '#c7d2fe',
                }}>
                  <IconCoins size={14} />
                  {plan.tokens}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  fontSize: '13px',
                  color: '#ddd6fe',
                }}>
                  <IconSparkles size={14} />
                  {plan.loraTokens}
                </div>
              </div>

              <button
                onClick={() => handlePurchase(plan.id, `${plan.name} Plan`, plan.price)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: plan.highlight ? 'none' : '1px solid rgba(99, 102, 241, 0.4)',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: plan.highlight
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.25))',
                  color: '#fff',
                  marginBottom: '24px',
                  transition: 'opacity 0.2s',
                }}
              >
                Purchase
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <feature.icon size={14} color="#818cf8" />
                    </div>
                    <span style={{ color: '#d1d5db', fontSize: '14px', display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                      {feature.name}
                      {feature.explanation && (
                        <HoverCard width={280} shadow="md">
                          <HoverCard.Target>
                            <IconInfoCircle size={14} style={{ marginLeft: '6px', cursor: 'help', color: '#6b7280', flexShrink: 0 }} />
                          </HoverCard.Target>
                          <HoverCard.Dropdown>
                            <Text size="sm">{feature.explanation}</Text>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ============ SECTION 2: TOKEN PACKS ============ */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconCoins size={20} color="#818cf8" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Token Packs</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', lineHeight: isMobile ? 1.3 : undefined }}>Buy Tokens</h2>
          <p style={{ color: '#9ca3af' }}>Generation tokens for creating images. Buy more, save more.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {tokenPacks.map((pack) => (
            <div
              key={pack.id}
              style={{
                borderRadius: '16px',
                padding: '24px',
                background: 'linear-gradient(160deg, rgba(17, 17, 30, 0.9) 0%, rgba(30, 30, 50, 0.6) 100%)',
                border: '1px solid #333',
                textAlign: 'center',
                position: 'relative',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {pack.discount && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <IconDiscount2 size={12} />
                  {pack.discount}
                </div>
              )}

              <div style={{ marginBottom: '4px' }}>
                <IconCoins size={28} color="#818cf8" style={{ marginBottom: '8px' }} />
              </div>

              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '2px' }}>{pack.amount}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>tokens</div>

              <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{pack.price}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>{pack.pricePerToken}/token</div>

              <button
                onClick={() => handlePurchase(pack.id, `${pack.amount} Tokens`, pack.price)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#c7d2fe',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
              >
                Buy Tokens
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ============ SECTION 3: LORA TOKEN PACKS ============ */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconSparkles size={20} color="#a78bfa" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LoRA Token Packs</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', lineHeight: isMobile ? 1.3 : undefined }}>LoRA Character Training</h2>
          <p style={{ color: '#9ca3af' }}>Train custom AI models for your characters. Each token trains one LoRA model.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {loraTokenPacks.map((pack) => (
            <div
              key={pack.id}
              style={{
                borderRadius: '16px',
                padding: '24px',
                background: 'linear-gradient(160deg, rgba(17, 17, 30, 0.9) 0%, rgba(30, 30, 50, 0.6) 100%)',
                border: '1px solid #333',
                textAlign: 'center',
                position: 'relative',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a78bfa';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {pack.discount && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <IconDiscount2 size={12} />
                  {pack.discount}
                </div>
              )}

              <div style={{ marginBottom: '4px' }}>
                <IconSparkles size={28} color="#a78bfa" style={{ marginBottom: '8px' }} />
              </div>

              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '2px' }}>{pack.amount}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>LoRA {parseInt(pack.amount) === 1 ? 'token' : 'tokens'}</div>

              <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{pack.price}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>{pack.perUnit}</div>

              <button
                onClick={() => handlePurchase(pack.id, `${pack.amount} LoRA Token${parseInt(pack.amount) > 1 ? 's' : ''}`, pack.price)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  background: 'rgba(168, 85, 247, 0.1)',
                  color: '#ddd6fe',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'; }}
              >
                Buy LoRA Tokens
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <IconShieldCheck size={20} color="#818cf8" />
            <span style={{ fontWeight: 600, color: '#c7d2fe' }}>All Purchases Are One-Time</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            No subscriptions, no recurring charges. Buy tokens as you need them. Any purchase upgrades you to a Paid Customer with full access to all features.
          </p>
        </div>
      </div>

      {/* Payment Method Modal */}
      {selectedProduct && (
        <PaymentModal
          opened={modalOpened}
          onClose={() => { setModalOpened(false); setSelectedProduct(null); }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          price={selectedProduct.price}
        />
      )}
    </div>
  );
};

export default PricingPage;