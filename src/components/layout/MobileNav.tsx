import { useState, useEffect } from 'react';
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
  LogOut,
  Sparkles,
  Bell,
  UserCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Menu principal reduzido
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
];

// Submenu de Projetos
const projectsNavigation = [
  { name: 'Todos os Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Horas', href: '/time-tracking', icon: Clock },
];

// Submenu de Configurações
const settingsNavigation = [
  { name: 'Meu Perfil', href: '/profile', icon: UserCircle },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Preferências', href: '/settings', icon: Settings },
];

// Rotas de cada submenu
const projectRoutes = ['/projects', '/tasks', '/time-tracking'];
const settingsRoutes = ['/profile', '/notifications', '/settings'];

export function MobileNav() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Estado dos submenus
  const [projectsOpen, setProjectsOpen] = useState(() => {
    return projectRoutes.includes(location.pathname);
  });
  
  const [settingsOpen, setSettingsOpen] = useState(() => {
    return settingsRoutes.includes(location.pathname);
  });

  // Auto-expandir submenu quando navegar para uma rota dentro dele
  useEffect(() => {
    if (projectRoutes.includes(location.pathname)) {
      setProjectsOpen(true);
    }
    if (settingsRoutes.includes(location.pathname)) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  const isProjectsActive = projectRoutes.includes(location.pathname);
  const isSettingsActive = settingsRoutes.includes(location.pathname);

  const renderNavItem = (item: typeof mainNavigation[0], isSubItem = false) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isSubItem && 'ml-4',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
        {item.name}
      </Link>
    );
  };

  const renderCollapsibleTrigger = (
    icon: React.ElementType,
    label: string,
    isOpen: boolean,
    isActive: boolean
  ) => {
    const Icon = icon;
    return (
      <div
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
        <span className="flex-1">{label}</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
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
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-gradient">DesignFlow</span>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {/* Dashboard */}
                {renderNavItem(mainNavigation[0])}
                
                {/* Projetos - Collapsible */}
                <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
                  <CollapsibleTrigger className="w-full">
                    {renderCollapsibleTrigger(FolderKanban, 'Projetos', projectsOpen, isProjectsActive)}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 overflow-hidden">
                    {projectsNavigation.map((item) => renderNavItem(item, true))}
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Clientes */}
                {renderNavItem(mainNavigation[1])}
                
                {/* Financeiro */}
                {renderNavItem(mainNavigation[2])}
                
                {/* Configurações - Collapsible */}
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger className="w-full">
                    {renderCollapsibleTrigger(Settings, 'Configurações', settingsOpen, isSettingsActive)}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 overflow-hidden">
                    {settingsNavigation.map((item) => renderNavItem(item, true))}
                  </CollapsibleContent>
                </Collapsible>
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
