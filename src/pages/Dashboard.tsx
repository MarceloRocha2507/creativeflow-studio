import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderKanban, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Projetos Ativos',
      value: '0',
      icon: FolderKanban,
      change: 'Nenhum projeto ainda',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Horas Este Mês',
      value: '0h',
      icon: Clock,
      change: 'Comece a registrar',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Faturamento Previsto',
      value: 'R$ 0',
      icon: DollarSign,
      change: 'Adicione projetos',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Clientes Ativos',
      value: '0',
      icon: Users,
      change: 'Cadastre clientes',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">
            Olá, <span className="text-gradient">{user?.user_metadata?.full_name || 'Designer'}</span>! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aqui está o resumo da sua atividade
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:glow-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderKanban className="h-5 w-5 text-primary" />
                Projetos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhum projeto ainda</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie seu primeiro projeto para começar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhuma tarefa pendente</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suas tarefas aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-success" />
                Resumo de Horas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Timer className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Sem registros</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use o cronômetro para registrar horas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
                Prazos Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhum prazo próximo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Projetos com prazos aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
