import { useState, useEffect } from 'react';
import { getUserOrganizationBranding, OrganizationBranding } from '@/lib/organizationService';
import { getUserSafely } from '@/lib/authUtils';

export function useOrganizationBranding() {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { user, error } = await getUserSafely();
        
        if (error || !user) {
          setLoading(false);
          return;
        }

        const organizationBranding = await getUserOrganizationBranding(user.id);
        setBranding(organizationBranding);
        
      } catch (error) {
        console.error('Error fetching organization branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return { branding, loading };
}