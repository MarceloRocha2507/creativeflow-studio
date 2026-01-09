import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

// Demo data - in production this would come from the database
const data = [
  { day: 'Seg', hours: 6.5 },
  { day: 'Ter', hours: 8.2 },
  { day: 'Qua', hours: 7.0 },
  { day: 'Qui', hours: 9.5 },
  { day: 'Sex', hours: 5.5 },
  { day: 'Sáb', hours: 3.0 },
  { day: 'Dom', hours: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-accent">
          {payload[0].value}h trabalhadas
        </p>
      </div>
    );
  }
  return null;
};

export function HoursChart() {
  const totalHours = data.reduce((acc, item) => acc + item.hours, 0);
  const avgHours = totalHours / data.filter(d => d.hours > 0).length;
  const maxHours = Math.max(...data.map(d => d.hours));

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Horas Trabalhadas</h2>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          <TrendingUp className="h-3 w-3" />
          +12%
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{totalHours.toFixed(1)}h</span>
        <span className="text-sm text-muted-foreground">total</span>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="hours"
              fill="url(#hoursGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted-foreground">Dia mais produtivo</p>
          <p className="text-lg font-semibold">{data.find(d => d.hours === maxHours)?.day}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Média diária</p>
          <p className="text-lg font-semibold">{avgHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Meta semanal</p>
          <p className="text-lg font-semibold">40h</p>
        </div>
      </div>
    </div>
  );
}
