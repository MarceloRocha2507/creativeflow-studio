import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-primary">
          R$ {payload[0].value.toLocaleString('pt-BR')}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRevenueData = async () => {
      setLoading(true);
      
      // Get payments from the last 6 months
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching payments:', error);
        setLoading(false);
        return;
      }

      // Group payments by month
      const monthlyRevenue: Record<string, number> = {};
      
      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyRevenue[monthKey] = 0;
      }

      // Sum payments by month
      payments?.forEach(payment => {
        if (payment.payment_date) {
          const monthKey = payment.payment_date.substring(0, 7); // yyyy-MM
          if (monthlyRevenue[monthKey] !== undefined) {
            monthlyRevenue[monthKey] += Number(payment.amount);
          }
        }
      });

      // Convert to chart data format
      const chartData = Object.entries(monthlyRevenue).map(([key, value]) => ({
        month: format(parseISO(`${key}-01`), 'MMM', { locale: ptBR }),
        value,
      }));

      setData(chartData);
      setLoading(false);
    };

    fetchRevenueData();
  }, [user]);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const average = data.length > 0 ? total / data.length : 0;
  const lastMonth = data.length > 0 ? data[data.length - 1].value : 0;
  const previousMonth = data.length > 1 ? data[data.length - 2].value : 0;
  const growth = previousMonth > 0 
    ? ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1) 
    : '0.0';
  const isPositiveGrowth = Number(growth) >= 0;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary icon-glow" />
          </div>
          <div>
            <h2 className="font-semibold">Faturamento Mensal</h2>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary icon-glow" />
          </div>
          <div>
            <h2 className="font-semibold">Faturamento Mensal</h2>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          isPositiveGrowth ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositiveGrowth ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositiveGrowth ? '+' : ''}{growth}%
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold">R$ {lastMonth.toLocaleString('pt-BR')}</span>
        <span className="text-sm text-muted-foreground">este mês</span>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground">Total (6 meses)</p>
          <p className="text-lg font-semibold">R$ {total.toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Média mensal</p>
          <p className="text-lg font-semibold">R$ {Math.round(average).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
