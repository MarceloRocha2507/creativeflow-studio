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
  LogOut,
  Sparkles,
  Bell,
  UserCircle,
  Shield,
  Key,
  ScrollText,
  ChevronDown,
  Store,
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

const ADMIN_MENU_KEY = 'designflow-admin-menu-open';

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

// Admin navigation
const adminNavigation = [
  { name: 'Painel Admin', href: '/admin', icon: Shield },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Permissões', href: '/admin/roles', icon: Key },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Status da Loja', href: '/admin/shop-status', icon: Store },
];

// Rotas de cada submenu
const projectRoutes = ['/projects', '/tasks', '/time-tracking'];
const settingsRoutes = ['/profile', '/notifications', '/settings'];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  
  // Estado dos submenus
  const [projectsOpen, setProjectsOpen] = useState(() => {
    return projectRoutes.includes(location.pathname);
  });
  
  const [settingsOpen, setSettingsOpen] = useState(() => {
    return settingsRoutes.includes(location.pathname);
  });
  
  const [adminOpen, setAdminOpen] = useState(() => {
    const saved = localStorage.getItem(ADMIN_MENU_KEY);
    if (saved !== null) return saved === 'true';
    return false;
  });

  // Contadores para badges
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // Auto-expandir submenu quando navegar para uma rota dentro dele
  useEffect(() => {
    if (projectRoutes.includes(location.pathname)) {
      setProjectsOpen(true);
    }
    if (settingsRoutes.includes(location.pathname)) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(ADMIN_MENU_KEY, String(adminOpen));
  }, [adminOpen]);

  // Buscar contagens do banco
  useEffect(() => {
    const fetchCounts = async () => {
      // Projetos ativos
      const { count: projCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['in_progress', 'pending_approval']);
      
      // Tarefas pendentes
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['todo', 'in_progress']);
      
      // Notificações não lidas
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

  const renderNavItem = (item: typeof mainNavigation[0], isSubItem = false, index = 0, count?: number) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
          isSubItem && 'ml-4 animate-fade-in opacity-0',
          isActive
            ? 'bg-primary/10 text-primary active-indicator'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
        )}
        style={isSubItem ? { 
          animationDelay: `${index * 50}ms`,
          animationFillMode: 'forwards'
        } : undefined}
      >
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
          isActive 
            ? 'bg-primary/20 icon-glow' 
            : 'bg-secondary/50 group-hover:bg-secondary'
        )}>
          <item.icon className={cn(
            'h-4 w-4 transition-all duration-300',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )} />
        </div>
        <span className="relative flex-1">
          {item.name}
          {isActive && (
            <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-primary to-accent opacity-50" />
          )}
        </span>
        {count !== undefined && count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-medium text-primary">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  };

  const renderCollapsibleTrigger = (
    icon: React.ElementType,
    label: string,
    isOpen: boolean,
    isActive: boolean,
    count?: number
  ) => {
    const Icon = icon;
    return (
      <div
        className={cn(
          'group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
        )}
      >
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
          isActive 
            ? 'bg-primary/20 icon-glow' 
            : 'bg-secondary/50 group-hover:bg-secondary'
        )}>
          <Icon className={cn(
            'h-4 w-4 transition-all duration-300',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )} />
        </div>
        <span className="flex-1 ml-3 text-left">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-medium text-primary mr-2">
            {count > 99 ? '99+' : count}
          </span>
        )}
        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r border-border/50">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gradient">DesignFlow</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Studio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <div className="mb-4 px-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Menu Principal
            </span>
          </div>
          
          {/* Dashboard */}
          {renderNavItem(mainNavigation[0])}
          
          {/* Projetos - Collapsible */}
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <CollapsibleTrigger className="w-full p-0 text-left">
              {renderCollapsibleTrigger(FolderKanban, 'Projetos', projectsOpen, isProjectsActive, projectsCount)}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              {projectsNavigation.map((item, index) => {
                const itemCount = item.href === '/projects' ? projectsCount : item.href === '/tasks' ? tasksCount : undefined;
                return renderNavItem(item, true, index, itemCount);
              })}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Clientes */}
          {renderNavItem(mainNavigation[1])}
          
          {/* Financeiro */}
          {renderNavItem(mainNavigation[2])}
          
          {/* Configurações - Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="w-full p-0 text-left">
              {renderCollapsibleTrigger(Settings, 'Configurações', settingsOpen, isSettingsActive, unreadNotifications)}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              {settingsNavigation.map((item, index) => {
                const itemCount = item.href === '/notifications' ? unreadNotifications : undefined;
                return renderNavItem(item, true, index, itemCount);
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Admin Section - Separado e colapsado por padrão */}
          {isAdmin && (
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen} className="mt-6 pt-4 border-t border-border/50">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <span>Administração</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  adminOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                {adminNavigation.map((item, index) => renderNavItem(item, false, index))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
            onClick={signOut}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50">
              <LogOut className="h-4 w-4" />
            </div>
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
