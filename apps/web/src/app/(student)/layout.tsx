'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingState } from '@/components/shared/LoadingState/LoadingState';
import { Sidebar } from '@/components/shared/Sidebar/Sidebar';
import { TopNav } from '@/components/shared/TopNav/TopNav';
import { MobileSidebarProvider } from '@/components/shared/Sidebar/MobileSidebarContext';
import { ROUTES } from '@/data/constants';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Non-students should go to staff dashboard
    if (user && user.role.code !== 'STUDENT') {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading || !isAuthenticated || (user && user.role.code !== 'STUDENT')) {
    return <PageLoadingState />;
  }

  return (
    <MobileSidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}