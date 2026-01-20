import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { HoursChart } from '@/components/dashboard/HoursChart';
import { PendingReleasesCard } from '@/components/dashboard/PendingReleasesCard';
import {
  FolderKanban, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      const [
        projectsRes,
        newProjectsRes,
        timeEntriesRes,
        paymentsRes,
        clientsRes
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'completed'),
        
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString()),
        
        supabase
          .from('time_entries')
          .select('duration_minutes')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString()),
        
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'pending'),
        
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      const totalMinutes = (timeEntriesRes.data || []).reduce(
        (acc, entry) => acc + (entry.duration_minutes || 0), 0
      );
      const totalHours = Math.round(totalMinutes / 60);

      const pendingRevenue = (paymentsRes.data || []).reduce(
        (acc, payment) => acc + Number(payment.amount || 0), 0
      );

      return {
        activeProjects: projectsRes.count || 0,
        newProjectsThisMonth: newProjectsRes.count || 0,
        hoursThisWeek: totalHours,
        pendingRevenue,
        activeClients: clientsRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const stats = [
    {
      title: 'Projetos Ativos',
      value: isLoading ? '...' : String(dashboardStats?.activeProjects || 0),
      icon: FolderKanban,
      change: `+${dashboardStats?.newProjectsThisMonth || 0} este mês`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Horas Trabalhadas',
      value: isLoading ? '...' : `${dashboardStats?.hoursThisWeek || 0}h`,
      icon: Clock,
      change: 'Esta semana',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Faturamento',
      value: isLoading ? '...' : new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(dashboardStats?.pendingRevenue || 0),
      icon: DollarSign,
      change: 'Previsto',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Clientes',
      value: isLoading ? '...' : String(dashboardStats?.activeClients || 0),
      icon: Users,
      change: 'Ativos',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">
            {getGreeting()}, <span className="text-primary">{user?.user_metadata?.full_name || 'Designer'}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe seus projetos e métricas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div 
              key={stat.title} 
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground animate-fade-in">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-8 w-20" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold animate-fade-in">{stat.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <RevenueChart />
          <HoursChart />
          <div className="md:col-span-2 xl:col-span-1">
            <PendingReleasesCard />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Projetos Ativos</h2>
                  <p className="text-xs text-muted-foreground">Seus trabalhos em andamento</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects" className="gap-1">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-lg bg-muted p-3">
                  <FolderKanban className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Nenhum projeto ainda</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Crie seu primeiro projeto para começar
                </p>
                <Button className="mt-4 gap-2" asChild>
                  <Link to="/projects">
                    <Plus className="h-4 w-4" />
                    Criar Projeto
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Tarefas Pendentes</h2>
                  <p className="text-xs text-muted-foreground">O que precisa ser feito</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tasks" className="gap-1">
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-lg bg-muted p-3">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Nenhuma tarefa pendente</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Suas tarefas aparecerão aqui
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-lg border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Prazos Próximos</h2>
                  <p className="text-xs text-muted-foreground">Entregas agendadas</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-lg bg-muted p-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Nenhum prazo próximo</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Projetos com prazos definidos aparecerão aqui
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
