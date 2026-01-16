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
  Bell,
  UserCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
];

const projectsNavigation = [
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Horas', href: '/time-tracking', icon: Clock },
];

const settingsNavigation = [
  { name: 'Meu Perfil', href: '/profile', icon: UserCircle },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Preferências', href: '/settings', icon: Settings },
];

const projectRoutes = ['/projects', '/tasks', '/time-tracking'];
const settingsRoutes = ['/profile', '/notifications', '/settings'];

export function MobileNav() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  
  const [projectsOpen, setProjectsOpen] = useState(() => {
    return projectRoutes.includes(location.pathname);
  });
  
  const [settingsOpen, setSettingsOpen] = useState(() => {
    return settingsRoutes.includes(location.pathname);
  });

  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  useEffect(() => {
    if (projectRoutes.includes(location.pathname)) {
      setProjectsOpen(true);
    }
    if (settingsRoutes.includes(location.pathname)) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: projCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['in_progress', 'pending_approval']);
      
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['todo', 'in_progress']);
      
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      
      setProjectsCount(projCount || 0);
      setTasksCount(taskCount || 0);
      setUnreadNotifications(notifCount || 0);
    };
    
    fetchCounts();
  }, []);

  const isProjectsActive = projectRoutes.includes(location.pathname);
  const isSettingsActive = settingsRoutes.includes(location.pathname);

  const NavItem = ({ item, count, isSubItem = false }: { 
    item: typeof mainNavigation[0]; 
    count?: number; 
    isSubItem?: boolean;
  }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isSubItem && 'ml-6',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1">{item.name}</span>
        {count !== undefined && count > 0 && (
          <span className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
            isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'
          )}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <FolderKanban className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">DesignFlow</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar border-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                    <FolderKanban className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold">DesignFlow</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                <NavItem item={mainNavigation[0]} />
                
                {/* Projects Collapsible */}
                <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                      isProjectsActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}>
                      <FolderKanban className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Projetos</span>
                      {projectsCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary mr-1">
                          {projectsCount}
                        </span>
                      )}
                      <ChevronDown className={cn(
                        'h-4 w-4 transition-transform',
                        projectsOpen && 'rotate-180'
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {projectsNavigation.map((item) => (
                      <NavItem 
                        key={item.href} 
                        item={item} 
                        isSubItem 
                        count={item.href === '/tasks' ? tasksCount : undefined}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                
                <NavItem item={mainNavigation[1]} />
                <NavItem item={mainNavigation[2]} />
                
                {/* Settings Collapsible */}
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                      isSettingsActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}>
                      <Settings className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Configurações</span>
                      {unreadNotifications > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground mr-1">
                          {unreadNotifications}
                        </span>
                      )}
                      <ChevronDown className={cn(
                        'h-4 w-4 transition-transform',
                        settingsOpen && 'rotate-180'
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {settingsNavigation.map((item) => (
                      <NavItem 
                        key={item.href} 
                        item={item} 
                        isSubItem 
                        count={item.href === '/notifications' ? unreadNotifications : undefined}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </nav>

              <div className="border-t border-border p-3 space-y-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
