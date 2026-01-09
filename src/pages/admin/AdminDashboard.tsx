import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, Clock, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profilesRes, projectsRes, timeEntriesRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('time_entries').select('duration_minutes'),
        supabase.from('payments').select('amount').eq('status', 'paid'),
      ]);

      const totalHours = (timeEntriesRes.data || []).reduce(
        (acc, entry) => acc + (entry.duration_minutes || 0), 0
      ) / 60;

      const totalRevenue = (paymentsRes.data || []).reduce(
        (acc, payment) => acc + Number(payment.amount || 0), 0
      );

      return {
        totalUsers: profilesRes.count || 0,
        totalProjects: projectsRes.count || 0,
        totalHours: Math.round(totalHours),
        totalRevenue,
      };
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['admin-recent-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action,
          entity_type,
          details,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
  });

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total de Projetos",
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Horas Registradas",
      value: `${stats?.totalHours || 0}h`,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Faturamento Total",
      value: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.entity_type}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade registrada ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
