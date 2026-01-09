import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { HoursChart } from '@/components/dashboard/HoursChart';
import { 
  FolderKanban, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Target,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Projetos Ativos',
      value: '0',
      icon: FolderKanban,
      change: '+0 este mês',
      trend: 'neutral',
    },
    {
      title: 'Horas Trabalhadas',
      value: '0h',
      icon: Clock,
      change: 'Esta semana',
      trend: 'neutral',
    },
    {
      title: 'Faturamento',
      value: 'R$ 0',
      icon: DollarSign,
      change: 'Previsto',
      trend: 'neutral',
    },
    {
      title: 'Clientes',
      value: '0',
      icon: Users,
      change: 'Ativos',
      trend: 'neutral',
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
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary icon-glow" />
            <span className="text-sm font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold lg:text-4xl">
            {getGreeting()}, <span className="text-gradient">{user?.user_metadata?.full_name || 'Designer'}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe seus projetos e métricas em tempo real
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.title} 
              className="glass-card-hover rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary icon-glow" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{stat.change}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <HoursChart />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <div 
            className="glass-card rounded-2xl p-6 animate-fade-in-up"
            style={{ animationDelay: '800ms' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary icon-glow" />
                </div>
                <div>
                  <h2 className="font-semibold">Projetos Ativos</h2>
                  <p className="text-xs text-muted-foreground">Seus trabalhos em andamento</p>
                </div>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                Ver todos
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Nenhum projeto ainda</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Crie seu primeiro projeto para começar a organizar seu trabalho
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:glow-primary">
                <Target className="h-4 w-4" />
                Criar Projeto
              </button>
            </div>
          </div>

          {/* Pending Tasks */}
          <div 
            className="glass-card rounded-2xl p-6 animate-fade-in-up"
            style={{ animationDelay: '900ms' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold">Tarefas Pendentes</h2>
                  <p className="text-xs text-muted-foreground">O que precisa ser feito</p>
                </div>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                Ver todas
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Nenhuma tarefa pendente</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Suas tarefas aparecerão aqui quando você adicioná-las
              </p>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div 
            className="glass-card rounded-2xl p-6 animate-fade-in-up"
            style={{ animationDelay: '1000ms' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h2 className="font-semibold">Prazos Próximos</h2>
                  <p className="text-xs text-muted-foreground">Entregas agendadas</p>
                </div>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                Calendário
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Nenhum prazo próximo</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Projetos com prazos definidos aparecerão aqui
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
