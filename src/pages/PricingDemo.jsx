import React from 'react';
import { ModernPricingPage } from '@/components/ui/animated-glassy-pricing';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    planName: 'Free',
    description: 'Get started at no cost',
    price: '0',
    features: [
      '1 profile per account',
      'Log game, practice & training sessions',
      'Scoring stats only',
      'Season Stats tab only',
      '5 AI messages per week',
    ],
    buttonText: 'Current Plan',
    isPopular: false,
    buttonVariant: 'secondary',
  },
  {
    planName: 'Pro',
    description: 'Full access, no limits',
    price: '4.99',
    features: [
      'Unlimited profiles',
      'All session types incl. Shift Tracker',
      'All stats categories',
      'All Stats tabs (Weekly, Monthly, Career)',
      'Unlimited AI messages',
    ],
    buttonText: 'Upgrade to Pro',
    isPopular: true,
    buttonVariant: 'primary',
  },
];

export default function PricingDemo() {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate(createPageUrl('Plans'));
  };

  const plansWithHandlers = plans.map((plan) =>
    plan.buttonVariant === 'primary'
      ? { ...plan, onButtonClick: handleUpgrade }
      : plan
  );

  return (
    <ModernPricingPage
      title="Simple, Transparent Pricing"
      subtitle="Everything you need to take your game to the next level."
      plans={plansWithHandlers}
      showAnimatedBackground={true}
    />
  );
}