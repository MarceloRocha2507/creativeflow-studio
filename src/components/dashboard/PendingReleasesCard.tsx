import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PendingReleasesCard() {
  const { user } = useAuth();

  const { data: pendingReleases, isLoading } = useQuery({
    queryKey: ['pending-releases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, net_amount, release_date, project_id, projects(name)')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('release_date', today)
        .order('release_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalPending = pendingReleases?.reduce((sum, payment) => {
    return sum + (payment.net_amount || payment.amount || 0);
  }, 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-3 w-32" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Lock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold">Pendente de Liberação</h2>
            <p className="text-xs text-muted-foreground">Valores retidos por plataformas</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/finances" className="gap-1">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="p-6">
        {pendingReleases && pendingReleases.length > 0 ? (
          <div className="space-y-4">
            {/* Total */}
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
              <p className="text-sm text-muted-foreground">Total a ser liberado</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatCurrency(totalPending)}
              </p>
            </div>

            {/* List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Próximas liberações:</p>
              <div className="space-y-2">
                {pendingReleases.map((payment) => {
                  const releaseDate = parseISO(payment.release_date!);
                  const daysRemaining = differenceInDays(releaseDate, new Date());
                  
                  return (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-amber-500/10 p-1.5">
                          <Calendar className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {format(releaseDate, 'dd/MM', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[120px]">
                            {(payment.projects as any)?.name || 'Projeto'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(payment.net_amount || payment.amount)}
                        </p>
                        <p className="text-xs text-amber-600">
                          {daysRemaining === 0 
                            ? 'Hoje' 
                            : daysRemaining === 1 
                              ? 'Amanhã' 
                              : `em ${daysRemaining} dias`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 rounded-lg bg-muted p-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Nenhum valor pendente</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Valores retidos por plataformas aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
