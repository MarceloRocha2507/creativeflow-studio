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
import { startOfMonth, subMonths, format, parseISO, startOfWeek, subWeeks, startOfQuarter, subQuarters } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Period = 'week' | 'month' | 'quarter';

interface DataPoint {
  label: string;
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
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [previousPeriodTotal, setPreviousPeriodTotal] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchRevenueData = async () => {
      setLoading(true);
      
      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;
      
      const now = new Date();
      
      if (period === 'week') {
        startDate = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });
        previousEndDate = startOfWeek(subWeeks(now, 4), { weekStartsOn: 1 });
      } else if (period === 'quarter') {
        startDate = startOfQuarter(subQuarters(now, 3));
        previousStartDate = startOfQuarter(subQuarters(now, 7));
        previousEndDate = startOfQuarter(subQuarters(now, 4));
      } else {
        startDate = startOfMonth(subMonths(now, 5));
        previousStartDate = startOfMonth(subMonths(now, 11));
        previousEndDate = startOfMonth(subMonths(now, 6));
      }
      
      // Fetch current period payments
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('payment_date', startDate.toISOString().split('T')[0]);

      // Fetch previous period payments for comparison
      const { data: previousPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('payment_date', previousStartDate.toISOString().split('T')[0])
        .lt('payment_date', previousEndDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching payments:', error);
        setLoading(false);
        return;
      }

      // Calculate previous period total
      const prevTotal = previousPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setPreviousPeriodTotal(prevTotal);

      // Group payments by period
      const groupedData: Record<string, number> = {};
      
      if (period === 'week') {
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const weekDate = subWeeks(now, i);
          const weekKey = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          groupedData[weekKey] = 0;
        }
        
        payments?.forEach(payment => {
          if (payment.payment_date) {
            const paymentDate = parseISO(payment.payment_date);
            const weekKey = format(startOfWeek(paymentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (groupedData[weekKey] !== undefined) {
              groupedData[weekKey] += Number(payment.amount);
            }
          }
        });
      } else if (period === 'quarter') {
        // Last 4 quarters
        for (let i = 3; i >= 0; i--) {
          const quarterDate = subQuarters(now, i);
          const quarterKey = format(startOfQuarter(quarterDate), 'yyyy-MM');
          groupedData[quarterKey] = 0;
        }
        
        payments?.forEach(payment => {
          if (payment.payment_date) {
            const paymentDate = parseISO(payment.payment_date);
            const quarterKey = format(startOfQuarter(paymentDate), 'yyyy-MM');
            if (groupedData[quarterKey] !== undefined) {
              groupedData[quarterKey] += Number(payment.amount);
            }
          }
        });
      } else {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthKey = format(monthDate, 'yyyy-MM');
          groupedData[monthKey] = 0;
        }
        
        payments?.forEach(payment => {
          if (payment.payment_date) {
            const monthKey = payment.payment_date.substring(0, 7);
            if (groupedData[monthKey] !== undefined) {
              groupedData[monthKey] += Number(payment.amount);
            }
          }
        });
      }

      // Convert to chart data format
      const chartData = Object.entries(groupedData).map(([key, value]) => {
        let label: string;
        if (period === 'week') {
          label = format(parseISO(key), "'Sem' w", { locale: ptBR });
        } else if (period === 'quarter') {
          label = format(parseISO(`${key}-01`), "'T'Q yyyy", { locale: ptBR });
        } else {
          label = format(parseISO(`${key}-01`), 'MMM', { locale: ptBR });
        }
        return { label, value };
      });

      setData(chartData);
      setLoading(false);
    };

    fetchRevenueData();
  }, [user, period]);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const currentPeriodValue = data.length > 0 ? data[data.length - 1].value : 0;
  const growth = previousPeriodTotal > 0 
    ? ((total - previousPeriodTotal) / previousPeriodTotal * 100).toFixed(1) 
    : total > 0 ? '100.0' : '0.0';
  const isPositiveGrowth = Number(growth) >= 0;

  const periodLabels = {
    week: 'Últimas 4 semanas',
    month: 'Últimos 6 meses',
    quarter: 'Últimos 4 trimestres',
  };

  const currentLabel = {
    week: 'esta semana',
    month: 'este mês',
    quarter: 'este trimestre',
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary icon-glow" />
          </div>
          <div>
            <h2 className="font-semibold">Faturamento</h2>
            <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
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
            <h2 className="font-semibold">Faturamento</h2>
            <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[120px] h-8 text-xs glass-border bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
            </SelectContent>
          </Select>
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            isPositiveGrowth ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {isPositiveGrowth ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositiveGrowth ? '+' : ''}{growth}%
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold">R$ {currentPeriodValue.toLocaleString('pt-BR')}</span>
        <span className="text-sm text-muted-foreground">{currentLabel[period]}</span>
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
              dataKey="label" 
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
          <p className="text-xs text-muted-foreground">Total do período</p>
          <p className="text-lg font-semibold">R$ {total.toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Média</p>
          <p className="text-lg font-semibold">R$ {Math.round(data.length > 0 ? total / data.length : 0).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
