import { useMemo } from 'react';
import useAppStore from '../store';
import { SubscriptionPlan } from '../types';


export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  isPremium: boolean;
  isPro: boolean;
  isYearly: boolean;
  invoiceLimit: number;
  clientLimit: number;
  label: string;
  hindiLabel: string;
}

export const useSubscription = (): SubscriptionInfo => {
  const { subscription } = useAppStore();

  const subscriptionInfo = useMemo(() => {
    const isPremium = subscription === 'PRO' || subscription === 'YEARLY';
    const isPro = subscription === 'PRO';
    const isYearly = subscription === 'YEARLY';

    // Premium plans have virtually infinite limits, otherwise localized limits are placed
    const invoiceLimit = isPremium ? 99999 : 5;
    const clientLimit = isPremium ? 99999 : 5;

    const labelMap: Record<SubscriptionPlan, string> = {
      FREE: 'Free Basic Plan',
      PRO: 'PRO monthly Plan',
      YEARLY: 'PRO Year Business Plan'
    };

    const hindiLabelMap: Record<SubscriptionPlan, string> = {
      FREE: 'मुफ़्त प्लान',
      PRO: 'मंथली प्रो प्लान',
      YEARLY: 'सालाना प्रो बिज़नस प्लान'
    };

    return {
      plan: subscription,
      isPremium,
      isPro,
      isYearly,
      invoiceLimit,
      clientLimit,
      label: labelMap[subscription] || 'Free Basic Plan',
      hindiLabel: hindiLabelMap[subscription] || 'मुफ़्त प्लान'
    };
  }, [subscription]);

  return subscriptionInfo;
};

export default useSubscription;
