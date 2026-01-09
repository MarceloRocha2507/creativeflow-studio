import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

// Demo data - in production this would come from the database
const data = [
  { month: 'Jan', value: 4500 },
  { month: 'Fev', value: 5200 },
  { month: 'Mar', value: 4800 },
  { month: 'Abr', value: 6100 },
  { month: 'Mai', value: 5800 },
  { month: 'Jun', value: 7200 },
];

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
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const average = total / data.length;
  const lastMonth = data[data.length - 1].value;
  const previousMonth = data[data.length - 2].value;
  const growth = ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1);

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
        <div className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <TrendingUp className="h-3 w-3" />
          +{growth}%
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
              tickFormatter={(value) => `${value / 1000}k`}
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
