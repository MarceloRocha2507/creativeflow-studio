import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, CheckSquare, Calendar, MoreVertical, Pencil, Trash2, Circle, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
  created_at: string;
  projects?: { name: string } | null;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [tasksRes, projectsRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').in('status', ['in_progress', 'pending_approval']),
    ]);

    if (tasksRes.error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar tarefas', description: tasksRes.error.message });
    } else {
      setTasks(tasksRes.data || []);
    }

    if (!projectsRes.error) {
      setProjects(projectsRes.data || []);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setStatus('todo');
    setPriority('medium');
    setDueDate('');
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setProjectId(task.project_id || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const taskData = {
      user_id: user.id,
      title,
      description: description || null,
      project_id: projectId || null,
      status,
      priority,
      due_date: dueDate || null,
    };

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar tarefa', description: error.message });
      } else {
        toast({ title: 'Tarefa atualizada!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('tasks').insert([taskData]);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar tarefa', description: error.message });
      } else {
        toast({ title: 'Tarefa criada!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const { error } = await supabase.from('tasks').update({ 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    }).eq('id', task.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
    } else {
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Tarefa excluída!' });
      fetchData();
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusIcons: Record<string, React.ReactNode> = {
    todo: <Circle className="h-5 w-5 text-muted-foreground" />,
    in_progress: <Clock className="h-5 w-5 text-cyan-400" />,
    completed: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-muted/50 text-muted-foreground border-border/50',
    medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Tarefas</h1>
            <p className="text-muted-foreground">Organize suas pendências e entregas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 glow-primary">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle className="text-gradient">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
                <DialogDescription className="sr-only">Formulário de criação ou edição de tarefa</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="glass border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="glass border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projeto</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="todo">A fazer</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="glass border-white/10" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="glass border-white/10">Cancelar</Button>
                  <Button type="submit" className="gradient-primary glow-primary">{editingTask ? 'Salvar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar tarefas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 glass border-white/10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 glass border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="todo">A fazer</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="glass-card glass-border">
                <CardContent className="flex items-start gap-4 p-4">
                  <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-1 h-4 w-32" />
                    <div className="mt-2 flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="glass-card border-white/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full glass p-4">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'Tente ajustar os filtros' : 'Crie sua primeira tarefa'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <Card 
                key={task.id} 
                className={`glass-card glass-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <button onClick={() => toggleStatus(task)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                    {statusIcons[task.status]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.projects?.name && (
                          <p className="text-sm text-muted-foreground">{task.projects.name}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-white/10">
                          <DropdownMenuItem onClick={() => openEditDialog(task)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {priorityLabels[task.priority]}
                      </Badge>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 text-primary/70" />
                          {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
