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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Horas', href: '/time-tracking', icon: Clock },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Financeiro', href: '/finances', icon: DollarSign },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Meu Perfil', href: '/profile', icon: UserCircle },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'Painel Admin', href: '/admin', icon: Shield },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Permissões', href: '/admin/roles', icon: Key },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const renderNavItem = (item: typeof navigation[0], index: number) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
          isActive
            ? 'bg-primary/10 text-primary active-indicator'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
        )}
        style={{ 
          animationDelay: `${index * 50}ms`,
        }}
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
        <span className="relative">
          {item.name}
          {isActive && (
            <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-primary to-accent opacity-50" />
          )}
        </span>
      </Link>
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
          {navigation.map((item, index) => renderNavItem(item, index))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="mb-4 mt-6 px-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Administração
                </span>
              </div>
              {adminNavigation.map((item, index) => renderNavItem(item, index))}
            </>
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
