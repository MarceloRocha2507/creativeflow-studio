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
    <div className="min-h-screen gradient-mesh">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-72 w-72 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Header with Notifications */}
      <div className="fixed right-6 top-4 z-50 hidden lg:flex items-center gap-4">
        <div className="glass rounded-full p-1">
          <NotificationBell />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative lg:pl-64">
        <div className="min-h-screen pt-14 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
