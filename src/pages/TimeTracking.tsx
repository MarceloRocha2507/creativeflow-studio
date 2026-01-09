import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, Plus, Clock, Trash2, Calendar } from 'lucide-react';
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
}

interface TimeEntry {
  id: string;
  project_id: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  projects?: { name: string } | null;
}

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualStart, setManualStart] = useState('09:00');
  const [manualEnd, setManualEnd] = useState('10:00');

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (activeEntry) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeEntry.start_time);
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEntry]);

  const fetchData = async () => {
    if (!user) return;

    const [entriesRes, projectsRes] = await Promise.all([
      supabase.from('time_entries').select('*, projects(name)').order('start_time', { ascending: false }).limit(50),
      supabase.from('projects').select('id, name').in('status', ['in_progress', 'pending_approval']),
    ]);

    if (entriesRes.error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar registros', description: entriesRes.error.message });
    } else {
      setEntries(entriesRes.data || []);
      const running = entriesRes.data?.find(e => e.is_running);
      if (running) setActiveEntry(running);
    }

    if (!projectsRes.error) {
      setProjects(projectsRes.data || []);
    }

    setIsLoading(false);
  };

  const startTimer = async () => {
    if (!user || !selectedProject) {
      toast({ variant: 'destructive', title: 'Selecione um projeto' });
      return;
    }

    const { data, error } = await supabase.from('time_entries').insert([{
      user_id: user.id,
      project_id: selectedProject,
      description: description || null,
      start_time: new Date().toISOString(),
      is_running: true,
    }]).select('*, projects(name)').single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao iniciar cronômetro', description: error.message });
    } else {
      setActiveEntry(data);
      toast({ title: 'Cronômetro iniciado!' });
      fetchData();
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    const endTime = new Date();
    const startTime = new Date(activeEntry.start_time);
    const durationMinutes = differenceInMinutes(endTime, startTime);

    const { error } = await supabase.from('time_entries').update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      is_running: false,
    }).eq('id', activeEntry.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao parar cronômetro', description: error.message });
    } else {
      setActiveEntry(null);
      toast({ title: 'Tempo registrado!', description: `${formatDuration(durationMinutes * 60)}` });
      fetchData();
    }
  };

  const addManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;

    const startTime = new Date(`${manualDate}T${manualStart}`);
    const endTime = new Date(`${manualDate}T${manualEnd}`);
    const durationMinutes = differenceInMinutes(endTime, startTime);

    if (durationMinutes <= 0) {
      toast({ variant: 'destructive', title: 'Horário inválido', description: 'O horário final deve ser maior que o inicial' });
      return;
    }

    const { error } = await supabase.from('time_entries').insert([{
      user_id: user.id,
      project_id: selectedProject,
      description: description || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      is_running: false,
    }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar registro', description: error.message });
    } else {
      toast({ title: 'Registro adicionado!' });
      setIsDialogOpen(false);
      setDescription('');
      fetchData();
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Registro excluído!' });
      fetchData();
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalHours = (entries: TimeEntry[]) => {
    return entries.reduce((acc, entry) => acc + (entry.duration_minutes || 0), 0) / 60;
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const weeklyEntries = entries.filter(e => {
    const date = new Date(e.start_time);
    return date >= weekStart && date <= weekEnd && !e.is_running;
  });

  const monthlyEntries = entries.filter(e => {
    const date = new Date(e.start_time);
    return date >= monthStart && date <= monthEnd && !e.is_running;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Controle de Horas</h1>
            <p className="text-muted-foreground">Registre e acompanhe seu tempo de trabalho</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 glass border-white/10">
                <Plus className="h-4 w-4" />
                Registro Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle className="text-gradient">Adicionar Registro Manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={addManualEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label>Projeto *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                    <SelectContent className="glass-card border-white/10">
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que você fez?" className="glass border-white/10" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} className="glass border-white/10" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="glass border-white/10">Cancelar</Button>
                  <Button type="submit" className="gradient-primary glow-primary">Adicionar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Timer Card */}
        <Card className="glass-card glass-border glow-primary overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
              <div className="flex flex-col items-center gap-4 lg:flex-row">
                <div className="text-5xl font-bold font-mono text-gradient animate-pulse-glow">
                  {formatDuration(elapsedTime)}
                </div>
                {activeEntry && (
                  <div className="text-center lg:text-left">
                    <p className="font-medium">{activeEntry.projects?.name}</p>
                    <p className="text-sm text-muted-foreground">{activeEntry.description || 'Sem descrição'}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {!activeEntry && (
                  <>
                    <div className="min-w-[200px]">
                      <Label className="text-xs text-muted-foreground">Projeto</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                          {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[200px]">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que você vai fazer?" className="glass border-white/10" />
                    </div>
                  </>
                )}
                <Button
                  size="lg"
                  className={activeEntry ? 'bg-red-500 hover:bg-red-600 glow-destructive' : 'gradient-primary glow-primary'}
                  onClick={activeEntry ? stopTimer : startTimer}
                >
                  {activeEntry ? (
                    <><Pause className="mr-2 h-5 w-5" />Parar</>
                  ) : (
                    <><Play className="mr-2 h-5 w-5" />Iniciar</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="rounded-lg bg-cyan-500/10 p-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                </div>
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{getTotalHours(weeklyEntries).toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">{weeklyEntries.length} registros</p>
            </CardContent>
          </Card>
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{getTotalHours(monthlyEntries).toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">{monthlyEntries.length} registros</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="text-gradient">Registros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : entries.filter(e => !e.is_running).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro ainda. Use o cronômetro acima para começar!
              </div>
            ) : (
              <div className="space-y-3">
                {entries.filter(e => !e.is_running).slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between rounded-xl glass glass-border p-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{entry.projects?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.start_time), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground truncate">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-400">
                        {entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : '-'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
