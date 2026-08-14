'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';

export default function NewLeadPage() {
  const router = useRouter();
  const { has } = usePermissions();

  useEffect(() => {
    if (has(PERMISSION_CODES.CREATE_LEAD)) {
      // Redirect back to leads list — dialog opens from there
      router.replace('/leads?create=1');
    } else {
      router.replace('/leads');
    }
  }, [router, has]);

  return <LoadingState message="Redirecting…" />;
}