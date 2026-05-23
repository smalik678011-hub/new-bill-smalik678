import { useMemo } from 'react';
import useAppStore from '../store';
import { BusinessProfile } from '../types';

export interface BusinessInfo {
  profile: BusinessProfile;
  hasGst: boolean;
  isRegisteredGST: boolean;
  formattedName: string;
  updateBusiness: (updates: Partial<BusinessProfile>) => void;
  language: 'Hinglish' | 'Hindi' | 'English';
}

export const useBusiness = (): BusinessInfo => {
  const { profile, updateProfile } = useAppStore();

  const businessInfo = useMemo(() => {
    const hasGst = !!(profile.gstNumber && profile.gstNumber.trim().length > 0);
    const isRegisteredGST = !!profile.isRegisteredGST;
    const formattedName = profile.businessName || 'My Business';
    const language = profile.language || 'Hinglish';

    return {
      profile,
      hasGst,
      isRegisteredGST,
      formattedName,
      updateBusiness: updateProfile,
      language
    };
  }, [profile, updateProfile]);

  return businessInfo;
};

export default useBusiness;
