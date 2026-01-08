import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotificationChecker } from '@/hooks/useNotificationChecker';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Check and create notifications on mount
  useNotificationChecker();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Header with Notifications */}
      <div className="fixed right-6 top-4 z-50 hidden lg:block">
        <NotificationBell />
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="min-h-screen pt-14 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
