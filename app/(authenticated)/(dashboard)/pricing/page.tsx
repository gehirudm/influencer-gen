"use client"

import React, { useEffect, useState } from 'react';

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Current plan',
    tokens: '50 Credits',
    images: '',
    features: [
      'Nudify Features',
      'Genfluence Feature',
      'Have To Add Water Mark (Accross The IMG)',
      'Promo Code',
    ],
    button: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '$39.99',
    tagline: 'One time fee',
    tokens: '1000 Credits',
    images: '',
    features: [
      'Nudify Feature',
      'Genfluence Feature',
      '$39.99',
    ],
    button: 'Purchase',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$64.99',
    tagline: 'One time fee',
    tokens: '10,000 Credits',
    images: '',
    features: [
      'Nudify Feature',
      'Genfluence Feature',
      'Character Engine Feature',
      '$64.99',
    ],
    button: 'Purchase',
    highlight: true,
    popular: true,
  },
];

const PricingPage = () => {
  const [currentPlan, setCurrentPlan] = useState('promo');

  const handleSubscribe = async (planName: string) => {
    console.log(`Redirecting to payment for: ${planName}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.href = `/payment?plan=${planName.toLowerCase()}`;
  };

  return (
    <div className="py-16 px-6 lg:px-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Pricing</h2>
        <p className="text-gray-600">
          Unlimited creativity at amazing prices. Try Genfluence for free or purchase a pack for more tokens and features.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
          {pricingPlans.map((plan, index) => {
            const isCurrent = currentPlan === plan.name;

            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start ${
                  plan.highlight ? 'border-4 border-blue-500' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="text-xs bg-blue-500 text-white font-bold rounded-full px-3 py-1 inline-block mb-2 w-fit">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-500 text-sm">{plan.tagline}</p>
                <p className="text-3xl font-bold mt-4">{plan.price}</p>
                <p className="text-sm text-gray-600 mt-2">{plan.tokens}</p>
                <p className="text-sm text-gray-600 mb-4">{plan.images}</p>
                <ul className="flex-1 space-y-2 text-sm text-gray-700">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`mt-6 w-full py-2 rounded-xl text-white font-semibold ${
                    plan.highlight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'
                  } ${isCurrent ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {isCurrent ? 'Current Plan' : 'Choose Plan'}
                </button>

                {plan.name === 'Free' && (
                  <button
                    onClick={() => alert('Enter promo code')}
                    className="mt-3 w-full py-2 rounded-xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50"
                  >
                    Enter Promo Code
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
