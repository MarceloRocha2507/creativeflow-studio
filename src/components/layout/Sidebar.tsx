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
  LogOut,
  Bell,
  Shield,
  Key,
  ScrollText,
  ChevronDown,
  Store,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const SIDEBAR_COLLAPSED_KEY = 'designflow-sidebar-collapsed';
const ADMIN_MENU_KEY = 'designflow-admin-menu-open';

// Main navigation
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
];

// Projects submenu
const projectsNavigation = [
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Horas', href: '/time-tracking', icon: Clock },
];

// Admin navigation
const adminNavigation = [
  { name: 'Painel Admin', href: '/admin', icon: Shield },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Permissões', href: '/admin/roles', icon: Key },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Status da Loja', href: '/admin/shop-status', icon: Store },
];

const projectRoutes = ['/projects', '/tasks', '/time-tracking'];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  
  const [projectsOpen, setProjectsOpen] = useState(() => {
    return projectRoutes.includes(location.pathname);
  });
  
  const [adminOpen, setAdminOpen] = useState(() => {
    const saved = localStorage.getItem(ADMIN_MENU_KEY);
    return saved === 'true';
  });

  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const [profile, setProfile] = useState<{
    full_name: string | null;
    logo_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (projectRoutes.includes(location.pathname)) {
      setProjectsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(ADMIN_MENU_KEY, String(adminOpen));
  }, [adminOpen]);

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, logo_url')
        .eq('user_id', user.id)
        .single();
      
      setProfile(data);
    };
    
    fetchProfile();
  }, [user]);

  const isProjectsActive = projectRoutes.includes(location.pathname);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const NavItem = ({ item, count, isSubItem = false }: { 
    item: typeof mainNavigation[0]; 
    count?: number; 
    isSubItem?: boolean;
  }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to={item.href}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {count !== undefined && count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.name}
            {count !== undefined && count > 0 && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                {count}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isSubItem && 'ml-6',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
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
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-200',
      isCollapsed ? 'w-16' : 'w-60'
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          'flex h-14 items-center border-b border-border px-3',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <FolderKanban className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">DesignFlow</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {/* Main Navigation */}
          <NavItem item={mainNavigation[0]} />
          
          {/* Projects Section */}
          {isCollapsed ? (
            <div className="space-y-1">
              {projectsNavigation.map((item) => (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  count={item.href === '/projects' ? projectsCount : item.href === '/tasks' ? tasksCount : undefined}
                />
              ))}
            </div>
          ) : (
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
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary">
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
          )}
          
          <NavItem item={mainNavigation[1]} />
          <NavItem item={mainNavigation[2]} />

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-4">
              {!isCollapsed && (
                <div className="mb-2 px-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Admin
                  </span>
                </div>
              )}
              {isCollapsed ? (
                <div className="space-y-1">
                  {adminNavigation.slice(0, 3).map((item) => (
                    <NavItem key={item.href} item={item} />
                  ))}
                </div>
              ) : (
                <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer">
                      <Shield className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Administração</span>
                      <ChevronDown className={cn(
                        'h-4 w-4 transition-transform',
                        adminOpen && 'rotate-180'
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {adminNavigation.map((item) => (
                      <NavItem key={item.href} item={item} isSubItem />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2">
          {isCollapsed ? (
            // Collapsed: Stack vertically
            <div className="flex flex-col items-center gap-1">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/profile"
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      location.pathname === '/profile'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.logo_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{profile?.full_name || 'Perfil'}</TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/notifications"
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      location.pathname === '/notifications'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Notificações</TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            // Expanded: All in one row
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors flex-1 min-w-0',
                  location.pathname === '/profile'
                    ? 'bg-primary/10'
                    : 'hover:bg-secondary'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profile?.logo_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{profile?.full_name || 'Usuário'}</span>
              </Link>

              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/notifications"
                      className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        location.pathname === '/notifications'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Bell className="h-4 w-4" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Notificações</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Sair</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
