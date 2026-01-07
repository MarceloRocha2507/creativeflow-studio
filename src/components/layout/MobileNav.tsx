import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  CheckSquare,
  DollarSign,
  Settings,
  Menu,
  X,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Horas', href: '/time-tracking', icon: Clock },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Palette className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-gradient">DesignFlow</span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center gap-2 border-b border-border px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Palette className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-gradient">DesignFlow</span>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
