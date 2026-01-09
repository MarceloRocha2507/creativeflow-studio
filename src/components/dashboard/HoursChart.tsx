import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format, addDays, subWeeks, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyData {
  day: string;
  hours: number;
  date: Date;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-accent">
          {payload[0].value.toFixed(1)}h trabalhadas
        </p>
      </div>
    );
  }
  return null;
};

export function HoursChart() {
  const { user } = useAuth();
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousWeekTotal, setPreviousWeekTotal] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchHoursData = async () => {
      setLoading(true);
      
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
      const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      // Fetch current week time entries
      const { data: currentEntries, error: currentError } = await supabase
        .from('time_entries')
        .select('start_time, duration_minutes, end_time')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      // Fetch previous week time entries for comparison
      const { data: previousEntries, error: previousError } = await supabase
        .from('time_entries')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', previousWeekStart.toISOString())
        .lte('start_time', previousWeekEnd.toISOString());

      if (currentError) {
        console.error('Error fetching time entries:', currentError);
        setLoading(false);
        return;
      }

      // Calculate previous week total
      const prevTotal = previousEntries?.reduce((sum, entry) => {
        return sum + (entry.duration_minutes || 0);
      }, 0) || 0;
      setPreviousWeekTotal(prevTotal / 60);

      // Initialize daily data for the week
      const dailyHours: DailyData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        dailyHours.push({
          day: format(date, 'EEE', { locale: ptBR }),
          hours: 0,
          date,
        });
      }

      // Sum hours by day
      currentEntries?.forEach(entry => {
        const entryDate = parseISO(entry.start_time);
        const dayIndex = dailyHours.findIndex(d => isSameDay(d.date, entryDate));
        if (dayIndex !== -1 && entry.duration_minutes) {
          dailyHours[dayIndex].hours += entry.duration_minutes / 60;
        }
      });

      setData(dailyHours);
      setLoading(false);
    };

    fetchHoursData();
  }, [user]);

  const totalHours = data.reduce((acc, item) => acc + item.hours, 0);
  const workDays = data.filter(d => d.hours > 0);
  const avgHours = workDays.length > 0 ? totalHours / workDays.length : 0;
  const maxHours = Math.max(...data.map(d => d.hours), 0);
  const mostProductiveDay = data.find(d => d.hours === maxHours && maxHours > 0);
  
  const growth = previousWeekTotal > 0 
    ? ((totalHours - previousWeekTotal) / previousWeekTotal * 100).toFixed(0)
    : totalHours > 0 ? '100' : '0';
  const isPositiveGrowth = Number(growth) >= 0;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Horas Trabalhadas</h2>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

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
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          isPositiveGrowth ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositiveGrowth ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositiveGrowth ? '+' : ''}{growth}%
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
          <p className="text-lg font-semibold">{mostProductiveDay?.day || '-'}</p>
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
