import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useNotificationChecker } from '@/hooks/useNotificationChecker';
import { cn } from '@/lib/utils';

const SIDEBAR_COLLAPSED_KEY = 'designflow-sidebar-collapsed';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useNotificationChecker();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Also listen for changes within the same tab
    const interval = setInterval(() => {
      const current = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
      if (current !== isCollapsed) {
        setIsCollapsed(current);
      }
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [isCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className={cn(
        'min-h-screen transition-all duration-200',
        'lg:pl-60',
        isCollapsed && 'lg:pl-16'
      )}>
        <div className="min-h-screen pt-14 lg:pt-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
