import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, FolderKanban, Calendar, DollarSign, MoreVertical, Pencil, Trash2, User, Users, Package, ExternalLink, Calculator } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  billing_type: string;
  budget: number | null;
  hourly_rate: number | null;
  start_date: string | null;
  deadline: string | null;
  client_id: string | null;
  package_total_value: number | null;
  package_total_arts: number | null;
  google_drive_link: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  projects: Project[];
}

// Agrupa projetos por cliente - apenas clientes com 2+ projetos são agrupados
const groupProjectsByClient = (projects: Project[]): { clientGroups: ClientGroup[]; standalone: Project[] } => {
  const groups: Record<string, Project[]> = {};
  const standalone: Project[] = [];

  // Agrupar por client_id
  projects.forEach(project => {
    if (project.client_id) {
      if (!groups[project.client_id]) {
        groups[project.client_id] = [];
      }
      groups[project.client_id].push(project);
    } else {
      standalone.push(project);
    }
  });

  // Separar grupos com 2+ projetos dos individuais
  const clientGroups: ClientGroup[] = [];

  Object.entries(groups).forEach(([clientId, clientProjects]) => {
    if (clientProjects.length >= 2) {
      clientGroups.push({
        clientId,
        clientName: clientProjects[0].clients?.name || 'Cliente',
        projects: clientProjects,
      });
    } else {
      standalone.push(...clientProjects);
    }
  });

  // Ordenar grupos por nome do cliente
  clientGroups.sort((a, b) => a.clientName.localeCompare(b.clientName));

  return { clientGroups, standalone };
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [priority, setPriority] = useState('medium');
  const [billingType, setBillingType] = useState('fixed');
  const [budget, setBudget] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Package form state
  const [packageTotalValue, setPackageTotalValue] = useState('');
  const [packageTotalArts, setPackageTotalArts] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  
  // Calculated unit value
  const calculatedUnitValue = (() => {
    const total = parseFloat(packageTotalValue);
    const arts = parseInt(packageTotalArts);
    if (total > 0 && arts > 0) {
      return total / arts;
    }
    return 0;
  })();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('status', 'active'),
    ]);

    if (projectsRes.error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar projetos', description: projectsRes.error.message });
    } else {
      setProjects(projectsRes.data || []);
    }

    if (!clientsRes.error) {
      setClients(clientsRes.data || []);
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setClientId('');
    setStatus('in_progress');
    setPriority('medium');
    setBillingType('fixed');
    setBudget('');
    setHourlyRate('');
    setStartDate('');
    setDeadline('');
    setPackageTotalValue('');
    setPackageTotalArts('');
    setGoogleDriveLink('');
    setEditingProject(null);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setClientId(project.client_id || '');
    setStatus(project.status);
    setPriority(project.priority);
    setBillingType(project.billing_type);
    setBudget(project.budget?.toString() || '');
    setHourlyRate(project.hourly_rate?.toString() || '');
    setStartDate(project.start_date || '');
    setDeadline(project.deadline || '');
    setPackageTotalValue(project.package_total_value?.toString() || '');
    setPackageTotalArts(project.package_total_arts?.toString() || '');
    setGoogleDriveLink(project.google_drive_link || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const projectData = {
      user_id: user.id,
      name,
      description: description || null,
      client_id: clientId || null,
      status,
      priority,
      billing_type: billingType,
      budget: budget ? parseFloat(budget) : null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      start_date: startDate || null,
      deadline: deadline || null,
      package_total_value: packageTotalValue ? parseFloat(packageTotalValue) : null,
      package_total_arts: packageTotalArts ? parseInt(packageTotalArts) : null,
      google_drive_link: googleDriveLink.trim() || null,
    };

    if (editingProject) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar projeto', description: error.message });
      } else {
        toast({ title: 'Projeto atualizado com sucesso!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar projeto', description: error.message });
      } else {
        toast({ title: 'Projeto criado com sucesso!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir projeto', description: error.message });
    } else {
      toast({ title: 'Projeto excluído com sucesso!' });
      fetchData();
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    paused: 'bg-muted/50 text-muted-foreground border-border/50',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const statusLabels: Record<string, string> = {
    in_progress: 'Em andamento',
    pending_approval: 'Aguardando aprovação',
    completed: 'Concluído',
    paused: 'Pausado',
    cancelled: 'Cancelado',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-muted-foreground',
    medium: 'text-cyan-400',
    high: 'text-amber-400',
    urgent: 'text-red-400',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Projetos</h1>
            <p className="text-muted-foreground">Gerencie seus projetos e serviços</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 glow-primary">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-gradient">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nome do Projeto *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="glass border-white/10" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="pending_approval">Aguardando aprovação</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingType">Tipo de Cobrança</Label>
                    <Select value={billingType} onValueChange={setBillingType}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="fixed">Valor Fixo</SelectItem>
                        <SelectItem value="hourly">Por Hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {billingType === 'fixed' ? (
                    <div className="space-y-2">
                      <Label htmlFor="budget">Valor do Projeto (R$)</Label>
                      <Input id="budget" type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} className="glass border-white/10" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Valor/Hora (R$)</Label>
                      <Input id="hourlyRate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="glass border-white/10" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo</Label>
                    <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="glass border-white/10" />
                  </div>
                  
                  {/* Package Section */}
                  <div className="sm:col-span-2 pt-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                      <Package className="h-4 w-4" />
                      <span>PACOTE COMERCIAL</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageTotalValue">Valor Total do Pacote (R$)</Label>
                    <Input 
                      id="packageTotalValue" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={packageTotalValue} 
                      onChange={(e) => setPackageTotalValue(e.target.value)} 
                      className="glass border-white/10" 
                      placeholder="0,00" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageTotalArts">Número Total de Artes</Label>
                    <Input 
                      id="packageTotalArts" 
                      type="number" 
                      min="1"
                      value={packageTotalArts} 
                      onChange={(e) => setPackageTotalArts(e.target.value)} 
                      className="glass border-white/10" 
                      placeholder="0" 
                    />
                  </div>
                  {calculatedUnitValue > 0 && (
                    <div className="sm:col-span-2 p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-2 text-primary">
                        <Calculator className="h-4 w-4" />
                        <span className="text-sm font-medium">Valor por Arte:</span>
                        <span className="text-lg font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedUnitValue)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente</p>
                    </div>
                  )}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="googleDriveLink">Link do Google Drive</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="googleDriveLink" 
                        type="url"
                        value={googleDriveLink} 
                        onChange={(e) => setGoogleDriveLink(e.target.value)} 
                        className="glass border-white/10 flex-1" 
                        placeholder="https://drive.google.com/drive/folders/..." 
                      />
                      {googleDriveLink && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          className="glass border-white/10 shrink-0"
                          onClick={() => window.open(googleDriveLink, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Logos, imagens e materiais do projeto</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="glass border-white/10">
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary glow-primary">
                    {editingProject ? 'Salvar' : 'Criar Projeto'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar projetos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 glass border-white/10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 glass border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="pending_approval">Aguardando aprovação</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="glass-card border-white/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full glass p-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'Tente ajustar os filtros' : 'Crie seu primeiro projeto'}
              </p>
            </CardContent>
          </Card>
        ) : (
          (() => {
            const { clientGroups, standalone } = groupProjectsByClient(filteredProjects);

            const ProjectCard = ({ project, index }: { project: Project; index: number }) => (
              <Card 
                key={project.id} 
                className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    {project.clients?.name && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                        <span className="truncate">{project.clients.name}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-white/10">
                      <DropdownMenuItem onClick={() => openEditDialog(project)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                    {project.package_total_value && project.package_total_arts && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        <Package className="h-3 w-3 mr-1" />
                        Pacote
                      </Badge>
                    )}
                    {project.google_drive_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-primary hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.google_drive_link!, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Drive
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    {project.deadline && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary/70" />
                        {format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}
                      </div>
                    )}
                    {(project.budget || project.hourly_rate) && (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                        R$ {project.budget || project.hourly_rate}/h
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );

            return (
              <div className="space-y-6">
                {/* Grupos de Clientes */}
                {clientGroups.map((group) => (
                  <div key={group.clientId} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{group.clientName}</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {group.projects.length} projetos
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-0 sm:pl-2 border-l-0 sm:border-l-2 border-primary/30">
                      {group.projects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Projetos Individuais */}
                {standalone.length > 0 && (
                  <>
                    {clientGroups.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FolderKanban className="h-4 w-4" />
                          <span className="font-medium">Projetos Individuais</span>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {standalone.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()
        )}
      </div>
    </AppLayout>
  );
}
