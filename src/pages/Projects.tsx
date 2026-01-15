import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, FolderKanban, Users, Package, FileText, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProjectDetailsDialog } from '@/components/projects/ProjectDetailsDialog';
import { StatusChips } from '@/components/projects/StatusChips';
import { ProjectListView } from '@/components/projects/ProjectListView';
import { ProjectCard } from '@/components/projects/ProjectCard';

// Função para formatar texto em Title Case
const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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
  created_at: string;
  project_type: string;
  package_total_arts: number | null;
  package_total_value: number | null;
  clients?: { name: string } | null;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  projects: Project[];
}

interface ProjectArt {
  id: string;
  name: string;
  status: string;
  art_type: string;
  order_index: number;
}

interface TimeEntry {
  id: string;
  duration_minutes: number | null;
  description: string | null;
}

// Mapa de prioridades para ordenação
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

// Função de ordenação por prioridade
const sortByPriority = (a: Project, b: Project): number => {
  return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
};

// Agrupa projetos por cliente - apenas clientes com 2+ projetos são agrupados
// IMPORTANTE: Preserva a ordenação por prioridade em todos os grupos
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
      // Ordenar projetos dentro do grupo por prioridade
      clientProjects.sort(sortByPriority);
      clientGroups.push({
        clientId,
        clientName: clientProjects[0].clients?.name || 'Cliente',
        projects: clientProjects,
      });
    } else {
      standalone.push(...clientProjects);
    }
  });

  // Ordenar standalone por prioridade
  standalone.sort(sortByPriority);

  // Ordenar grupos pelo projeto de maior prioridade dentro de cada grupo
  clientGroups.sort((a, b) => {
    const aPriority = Math.min(...a.projects.map(p => priorityOrder[p.priority] ?? 2));
    const bPriority = Math.min(...b.projects.map(p => priorityOrder[p.priority] ?? 2));
    return aPriority - bPriority;
  });

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'created' | 'deadline' | 'priority' | 'name' | 'value'>('priority');
  const [artsProgress, setArtsProgress] = useState<Record<string, number>>({});
  
  // View details state
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [projectArts, setProjectArts] = useState<ProjectArt[]>([]);
  const [projectTimeEntries, setProjectTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
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
  
  // Package state
  const [projectType, setProjectType] = useState<'single' | 'package'>('single');
  const [packageTotalValue, setPackageTotalValue] = useState('');
  const [packageTotalArts, setPackageTotalArts] = useState('');
  const [artNames, setArtNames] = useState<string[]>([]);
  
  // Form wizard step
  const [formStep, setFormStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  // Effect to manage art names array based on package total
  useEffect(() => {
    if (projectType === 'package') {
      const total = parseInt(packageTotalArts) || 0;
      setArtNames(prev => {
        if (total > prev.length) {
          const newNames = [...prev];
          for (let i = prev.length; i < total; i++) {
            newNames.push('');
          }
          return newNames;
        } else {
          return prev.slice(0, total);
        }
      });
    }
  }, [packageTotalArts, projectType]);

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
    setEditingProject(null);
    setProjectType('single');
    setPackageTotalValue('');
    setPackageTotalArts('');
    setArtNames([]);
    setFormStep(1);
  };

  const canProceedToNextStep = () => {
    if (formStep === 1) {
      if (projectType === 'single') return name.trim() !== '';
      return parseInt(packageTotalArts) > 0;
    }
    return true;
  };

  const loadProjectArts = async (projectId: string) => {
    const { data } = await supabase
      .from('project_arts')
      .select('name, order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    
    if (data && data.length > 0) {
      setArtNames(data.map(art => art.name));
    }
  };

  const openEditDialog = async (project: Project) => {
    setEditingProject(project);
    setFormStep(1); // Reset to step 1 when editing
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
    
    // Load package data
    const pType = (project.project_type === 'package' ? 'package' : 'single') as 'single' | 'package';
    setProjectType(pType);
    setPackageTotalValue(project.package_total_value?.toString() || '');
    setPackageTotalArts(project.package_total_arts?.toString() || '');
    
    if (pType === 'package') {
      await loadProjectArts(project.id);
    }
    
    setIsDialogOpen(true);
  };

  const openViewDialog = async (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
    setIsLoadingDetails(true);
    setProjectArts([]);
    setProjectTimeEntries([]);
    
    try {
      // Load arts if package
      if (project.project_type === 'package') {
        const { data: arts } = await supabase
          .from('project_arts')
          .select('id, name, status, art_type, order_index')
          .eq('project_id', project.id)
          .order('order_index');
        setProjectArts(arts || []);
      }
      
      // Load time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('id, duration_minutes, description')
        .eq('project_id', project.id);
      setProjectTimeEntries(timeEntries || []);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const updateArtStatus = async (artId: string, newStatus: string) => {
    const { error } = await supabase
      .from('project_arts')
      .update({ status: newStatus })
      .eq('id', artId);
      
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status', description: error.message });
      return;
    }
    
    setProjectArts(prev => 
      prev.map(art => 
        art.id === artId ? { ...art, status: newStatus } : art
      )
    );
    
    toast({ title: 'Status atualizado!' });
  };

  const updateProjectStatus = async (newStatus: string) => {
    if (!viewingProject) return;
    
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', viewingProject.id);
      
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status', description: error.message });
      return;
    }
    
    // Update local state
    setViewingProject(prev => prev ? { ...prev, status: newStatus } : null);
    setProjects(prev => 
      prev.map(p => 
        p.id === viewingProject.id ? { ...p, status: newStatus } : p
      )
    );
    
    toast({ title: 'Status do projeto atualizado!' });
  };

  const updateProjectName = async (newName: string) => {
    if (!viewingProject) return;
    
    const { error } = await supabase
      .from('projects')
      .update({ name: newName })
      .eq('id', viewingProject.id);
      
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar nome', description: error.message });
      return;
    }
    
    // Update local state
    setViewingProject(prev => prev ? { ...prev, name: newName } : null);
    setProjects(prev => 
      prev.map(p => 
        p.id === viewingProject.id ? { ...p, name: newName } : p
      )
    );
    
    toast({ title: 'Nome do projeto atualizado!' });
  };

  const updateArtName = async (artId: string, newName: string) => {
    const { error } = await supabase
      .from('project_arts')
      .update({ name: newName })
      .eq('id', artId);
      
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar nome', description: error.message });
      return;
    }
    
    setProjectArts(prev => 
      prev.map(art => 
        art.id === artId ? { ...art, name: newName } : art
      )
    );
    
    toast({ title: 'Nome da arte atualizado!' });
  };

  const formatTotalTime = (entries: TimeEntry[]) => {
    const totalMinutes = entries.reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0 && mins === 0) return 'Sem registros';
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  };

  const artStatusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    pending_approval: 'Em aprovação',
    completed: 'Concluída',
    approved: 'Aprovada',
  };

  const submitProject = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    // For package projects, auto-generate name if empty
    const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente';
    const projectName = projectType === 'package' && !name 
      ? `Pacote - ${clientName}` 
      : name;

    const projectData = {
      user_id: user.id,
      name: projectName,
      description: description || null,
      client_id: clientId || null,
      status,
      priority,
      project_type: projectType,
      billing_type: projectType === 'package' ? 'fixed' : billingType,
      budget: projectType === 'package' ? null : (budget ? parseFloat(budget) : null),
      hourly_rate: projectType === 'package' ? null : (hourlyRate ? parseFloat(hourlyRate) : null),
      package_total_value: projectType === 'package' && packageTotalValue ? parseFloat(packageTotalValue) : null,
      package_total_arts: projectType === 'package' && packageTotalArts ? parseInt(packageTotalArts) : null,
      start_date: startDate || null,
      deadline: deadline || null,
    };

    if (editingProject) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar projeto', description: error.message });
        return;
      }

      // Update arts if package
      if (projectType === 'package') {
        // Delete existing arts
        await supabase.from('project_arts').delete().eq('project_id', editingProject.id);
        
        // Insert new arts
        const artsToInsert = artNames.map((artName, index) => ({
          project_id: editingProject.id,
          user_id: user.id,
          name: artName || `Arte ${String(index + 1).padStart(2, '0')}`,
          order_index: index + 1,
          status: 'pending',
          art_type: 'feed',
        }));

        if (artsToInsert.length > 0) {
          await supabase.from('project_arts').insert(artsToInsert);
        }
      }

      toast({ title: 'Projeto atualizado com sucesso!' });
      fetchData();
      setIsDialogOpen(false);
      resetForm();
      setIsSaving(false);
    } else {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar projeto', description: error.message });
        return;
      }

      // Create arts if package
      if (projectType === 'package' && newProject) {
        const artsToInsert = artNames.map((artName, index) => ({
          project_id: newProject.id,
          user_id: user.id,
          name: artName || `Arte ${String(index + 1).padStart(2, '0')}`,
          order_index: index + 1,
          status: 'pending',
          art_type: 'feed',
        }));

        if (artsToInsert.length > 0) {
          await supabase.from('project_arts').insert(artsToInsert);
        }
      }

      toast({ title: 'Projeto criado com sucesso!' });
      fetchData();
      setIsDialogOpen(false);
      resetForm();
      setIsSaving(false);
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

  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort projects
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          const valueA = a.project_type === 'package' ? a.package_total_value : a.budget;
          const valueB = b.project_type === 'package' ? b.package_total_value : b.budget;
          return (valueB || 0) - (valueA || 0);
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const totalValue = projects.reduce((acc, p) => {
      const val = p.project_type === 'package' ? p.package_total_value : p.budget;
      return acc + (val || 0);
    }, 0);
    return { total: projects.length, inProgress, totalValue };
  }, [projects]);

  // Fetch arts progress for packages
  useEffect(() => {
    const fetchArtsProgress = async () => {
      const packageProjects = projects.filter(p => p.project_type === 'package');
      if (packageProjects.length === 0) return;

      const { data } = await supabase
        .from('project_arts')
        .select('project_id, status')
        .in('project_id', packageProjects.map(p => p.id));

      if (data) {
        const progress: Record<string, number> = {};
        data.forEach(art => {
          if (art.status === 'completed' || art.status === 'approved') {
            progress[art.project_id] = (progress[art.project_id] || 0) + 1;
          }
        });
        setArtsProgress(progress);
      }
    };

    fetchArtsProgress();
  }, [projects]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Projetos</h1>
            <p className="text-muted-foreground text-sm">
              {stats.total} projetos • {stats.inProgress} em andamento
              {stats.totalValue > 0 && ` • R$ ${stats.totalValue.toLocaleString('pt-BR')} em valor`}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 glow-primary">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gradient">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
              </DialogHeader>
              
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[
                  { step: 1, label: 'Tipo' },
                  { step: 2, label: 'Dados' },
                  { step: 3, label: 'Datas' }
                ].map(({ step, label }, index) => (
                  <div key={step} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => step < formStep && setFormStep(step)}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        step <= formStep ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      disabled={step > formStep}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        formStep === step 
                          ? 'bg-primary text-primary-foreground scale-110' 
                          : formStep > step 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {step}
                      </div>
                      <span className={`text-xs ${formStep === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </button>
                    {index < 2 && (
                      <div className={`w-12 h-0.5 mx-2 mt-[-12px] ${formStep > step ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4" onKeyDown={(e) => { if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) e.preventDefault(); }}>
                {/* Step 1: Tipo do Projeto */}
                {formStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Tipo de Projeto */}
                    <div className="space-y-2">
                      <Label>Tipo de Projeto</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setProjectType('single')}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            projectType === 'single'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-white/10 glass hover:border-white/20'
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                          <span className="font-medium text-sm">Projeto Avulso</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectType('package')}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            projectType === 'package'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-white/10 glass hover:border-white/20'
                          }`}
                        >
                          <Package className="h-5 w-5" />
                          <span className="font-medium text-sm">Pacote de Artes</span>
                        </button>
                      </div>
                    </div>

                    {/* Single project fields */}
                    {projectType === 'single' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome do Projeto *</Label>
                          <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(toTitleCase(e.target.value))} 
                            className="glass border-white/10" 
                            placeholder="Digite o nome..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
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
                              <Label htmlFor="budget">Valor (R$)</Label>
                              <Input id="budget" type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} className="glass border-white/10" placeholder="0,00" />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="hourlyRate">Valor/Hora (R$)</Label>
                              <Input id="hourlyRate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="glass border-white/10" placeholder="0,00" />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Package fields */}
                    {projectType === 'package' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="packageTotalValue">Valor Total (R$)</Label>
                            <Input 
                              id="packageTotalValue" 
                              type="number" 
                              step="0.01"
                              value={packageTotalValue} 
                              onChange={(e) => setPackageTotalValue(e.target.value)} 
                              className="glass border-white/10" 
                              placeholder="1500,00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packageTotalArts">Nº de Artes *</Label>
                            <Input 
                              id="packageTotalArts" 
                              type="number" 
                              min="1"
                              value={packageTotalArts} 
                              onChange={(e) => setPackageTotalArts(e.target.value)} 
                              className="glass border-white/10" 
                              placeholder="3"
                            />
                          </div>
                        </div>

                        {/* Art names */}
                        {artNames.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                              <Package className="h-4 w-4" />
                              <Label className="text-primary text-sm">Nomes das Artes ({artNames.length})</Label>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                              {artNames.map((artName, index) => (
                                <Input
                                  key={index}
                                  value={artName}
                                  onChange={(e) => {
                                    const newNames = [...artNames];
                                    newNames[index] = toTitleCase(e.target.value);
                                    setArtNames(newNames);
                                  }}
                                  className="glass border-white/10"
                                  placeholder={`Arte ${String(index + 1).padStart(2, '0')}`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              💡 Title Case automático
                            </p>
                          </div>
                        )}

                        {/* Optional project name */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome do Projeto (opcional)</Label>
                          <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(toTitleCase(e.target.value))} 
                            className="glass border-white/10" 
                            placeholder="Auto: Pacote - Nome do Cliente"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Dados Gerais */}
                {formStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
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
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="glass border-white/10" placeholder="Descrição do projeto (opcional)" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                  </div>
                )}

                {/* Step 3: Cronograma */}
                {formStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início</Label>
                        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass border-white/10" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deadline">Prazo</Label>
                        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="glass border-white/10" />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-white/5 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Resumo</p>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Tipo:</span> {projectType === 'package' ? 'Pacote de Artes' : 'Projeto Avulso'}</p>
                        <p><span className="text-muted-foreground">Nome:</span> {name || (projectType === 'package' ? 'Auto-gerado' : '-')}</p>
                        {projectType === 'package' && packageTotalArts && (
                          <p><span className="text-muted-foreground">Artes:</span> {packageTotalArts}</p>
                        )}
                        {clientId && (
                          <p><span className="text-muted-foreground">Cliente:</span> {clients.find(c => c.id === clientId)?.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-2 border-t border-white/10">
                  {formStep > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setFormStep(s => s - 1)} className="glass border-white/10">
                      ← Voltar
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="glass border-white/10">
                      Cancelar
                    </Button>
                  )}
                  
                  {formStep < 3 ? (
                    <Button 
                      type="button" 
                      onClick={() => setFormStep(s => s + 1)} 
                      disabled={!canProceedToNextStep()}
                      className="gradient-primary glow-primary"
                    >
                      Próximo →
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={submitProject}
                      disabled={isSaving}
                      className="gradient-primary glow-primary"
                    >
                      {isSaving ? 'Salvando...' : (editingProject ? 'Salvar' : 'Criar Projeto')}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Chips */}
        <StatusChips 
          projects={projects} 
          activeStatus={statusFilter} 
          onStatusChange={setStatusFilter} 
        />

        {/* Filters and View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar projetos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 glass border-white/10" />
          </div>
          
          {/* Sort */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-44 glass border-white/10">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="created">Mais recentes</SelectItem>
              <SelectItem value="deadline">Por prazo</SelectItem>
              <SelectItem value="priority">Por prioridade</SelectItem>
              <SelectItem value="name">Por nome</SelectItem>
              <SelectItem value="value">Por valor</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-9"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-9"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
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
        ) : viewMode === 'list' ? (
          <ProjectListView
            projects={filteredProjects}
            onView={openViewDialog}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
        ) : (
          (() => {
            const { clientGroups, standalone } = groupProjectsByClient(filteredProjects);

            const renderProjectCard = (project: Project, index: number) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                completedArts={artsProgress[project.id] || 0}
                onView={openViewDialog}
                onEdit={openEditDialog}
                onDelete={handleDelete}
              />
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
                      {group.projects.map((project, index) => renderProjectCard(project, index))}
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
                      {standalone.map((project, index) => renderProjectCard(project, index))}
                    </div>
                  </>
                )}
              </div>
            );
          })()
        )}

        {/* View Details Dialog */}
        <ProjectDetailsDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          project={viewingProject}
          projectArts={projectArts}
          projectTimeEntries={projectTimeEntries}
          isLoading={isLoadingDetails}
          onEdit={openEditDialog}
          onUpdateArtStatus={updateArtStatus}
          onUpdateProjectStatus={updateProjectStatus}
          onUpdateProjectName={updateProjectName}
          onUpdateArtName={updateArtName}
        />
      </div>
    </AppLayout>
  );
}