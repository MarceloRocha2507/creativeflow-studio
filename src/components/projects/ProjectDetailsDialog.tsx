import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calendar, DollarSign, User, Package, Clock, Pencil, 
  ChevronDown, ExternalLink, AlertCircle, CheckCircle2, 
  Eye, Layers, History, Filter
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  project_type: string;
  package_total_arts: number | null;
  package_total_value: number | null;
  google_drive_link?: string | null;
  clients?: { name: string } | null;
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
  start_time?: string;
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  projectArts: ProjectArt[];
  projectTimeEntries: TimeEntry[];
  isLoading: boolean;
  onEdit: (project: Project) => void;
  onUpdateArtStatus: (artId: string, status: string) => void;
  onUpdateProjectStatus: (status: string) => void;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted/50 text-muted-foreground border-muted',
  in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Andamento',
  on_hold: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
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
  completed: 'Concluída',
  approved: 'Aprovada',
};

const formatTotalTime = (entries: TimeEntry[]): string => {
  const totalMinutes = entries.reduce((acc, entry) => acc + (entry.duration_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
};

export function ProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  projectArts,
  projectTimeEntries,
  isLoading,
  onEdit,
  onUpdateArtStatus,
  onUpdateProjectStatus,
}: ProjectDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [artStatusFilter, setArtStatusFilter] = useState<string>('all');

  // Calculate deadline info
  const deadlineInfo = useMemo(() => {
    if (!project?.deadline) return null;
    const deadlineDate = new Date(project.deadline);
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    const isOverdue = isPast(deadlineDate) && project.status !== 'completed';
    
    return {
      daysRemaining,
      isOverdue,
      color: isOverdue 
        ? 'text-red-400 bg-red-500/10 border-red-500/30' 
        : daysRemaining <= 3 
          ? 'text-red-400 bg-red-500/10 border-red-500/30'
          : daysRemaining <= 7 
            ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      text: isOverdue 
        ? `Atrasado há ${Math.abs(daysRemaining)} dias`
        : daysRemaining === 0 
          ? 'Vence hoje!'
          : daysRemaining === 1
            ? 'Vence amanhã'
            : `${daysRemaining} dias restantes`,
    };
  }, [project?.deadline, project?.status]);

  // Calculate arts progress
  const artsProgress = useMemo(() => {
    if (!projectArts.length) return { completed: 0, total: 0, percentage: 0 };
    const completed = projectArts.filter(a => a.status === 'completed' || a.status === 'approved').length;
    return {
      completed,
      total: projectArts.length,
      percentage: Math.round((completed / projectArts.length) * 100),
    };
  }, [projectArts]);

  // Filter arts
  const filteredArts = useMemo(() => {
    if (artStatusFilter === 'all') return projectArts;
    return projectArts.filter(art => art.status === artStatusFilter);
  }, [projectArts, artStatusFilter]);

  // Recent time entries (last 5)
  const recentTimeEntries = useMemo(() => {
    return projectTimeEntries
      .filter(e => e.duration_minutes && e.duration_minutes > 0)
      .slice(0, 5);
  }, [projectTimeEntries]);

  const getProjectValue = () => {
    if (!project) return { value: 'Não definido', type: '' };
    
    if (project.project_type === 'package' && project.package_total_value) {
      return {
        value: `R$ ${project.package_total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        type: 'Valor do pacote',
      };
    }
    if (project.budget) {
      return {
        value: `R$ ${project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        type: 'Valor fixo',
      };
    }
    if (project.hourly_rate) {
      return {
        value: `R$ ${project.hourly_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h`,
        type: 'Por hora',
      };
    }
    return { value: 'Não definido', type: '' };
  };

  const markAllArtsAsCompleted = () => {
    projectArts.forEach(art => {
      if (art.status !== 'completed' && art.status !== 'approved') {
        onUpdateArtStatus(art.id, 'completed');
      }
    });
  };

  if (!project) return null;

  const projectValue = getProjectValue();
  const isPackage = project.project_type === 'package';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-gradient truncate">
                {project.name}
              </DialogTitle>
              {project.clients?.name && (
                <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{project.clients.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Editable Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${statusColors[project.status]} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                  >
                    {statusLabels[project.status]}
                    <ChevronDown className="h-3 w-3" />
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <DropdownMenuItem key={key} onClick={() => onUpdateProjectStatus(key)}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        key === 'not_started' ? 'bg-muted-foreground' :
                        key === 'in_progress' ? 'bg-cyan-400' :
                        key === 'on_hold' ? 'bg-yellow-400' :
                        key === 'completed' ? 'bg-emerald-400' :
                        'bg-red-400'
                      }`} />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Priority Badge */}
              <Badge variant="outline" className={priorityColors[project.priority]}>
                {priorityLabels[project.priority]}
              </Badge>
              
              {/* Package Badge */}
              {isPackage && (
                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                  <Package className="h-3 w-3 mr-1" />
                  Pacote
                </Badge>
              )}
            </div>
          </div>
          
          {/* Deadline Indicator */}
          {deadlineInfo && (
            <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg border ${deadlineInfo.color}`}>
              {deadlineInfo.isOverdue ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{deadlineInfo.text}</span>
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-6 mt-4 w-fit bg-muted/30 border border-white/5">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Eye className="h-4 w-4 mr-2" />
                  Visão Geral
                </TabsTrigger>
                {isPackage && (
                  <TabsTrigger value="arts" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <Layers className="h-4 w-4 mr-2" />
                    Artes
                    {artsProgress.total > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {artsProgress.completed}/{artsProgress.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                <TabsTrigger value="time" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <History className="h-4 w-4 mr-2" />
                  Tempo
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6 py-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4 animate-fade-in">
                  {/* Description */}
                  {project.description && (
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Data de Início</span>
                      </div>
                      <p className="font-medium">
                        {project.start_date 
                          ? format(new Date(project.start_date), "dd 'de' MMM, yyyy", { locale: ptBR }) 
                          : 'Não definido'}
                      </p>
                    </div>
                    
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Prazo Final</span>
                      </div>
                      <p className="font-medium">
                        {project.deadline 
                          ? format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR }) 
                          : 'Não definido'}
                      </p>
                    </div>
                    
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs">{projectValue.type || 'Valor'}</span>
                      </div>
                      <p className="font-medium text-emerald-400">{projectValue.value}</p>
                    </div>
                    
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Tempo Trabalhado</span>
                      </div>
                      <p className="font-medium">{formatTotalTime(projectTimeEntries)}</p>
                    </div>
                  </div>

                  {/* Arts Progress (for packages) */}
                  {isPackage && artsProgress.total > 0 && (
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Progresso das Artes</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {artsProgress.completed} de {artsProgress.total} concluídas
                        </span>
                      </div>
                      <Progress value={artsProgress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2 text-right">{artsProgress.percentage}%</p>
                    </div>
                  )}
                </TabsContent>

                {/* Arts Tab */}
                {isPackage && (
                  <TabsContent value="arts" className="mt-0 space-y-4 animate-fade-in">
                    {/* Progress Bar */}
                    <div className="glass rounded-lg p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progresso Geral</span>
                        <span className="text-sm font-bold text-primary">{artsProgress.percentage}%</span>
                      </div>
                      <Progress value={artsProgress.percentage} className="h-3" />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{artsProgress.completed} concluídas</span>
                        <span>{artsProgress.total - artsProgress.completed} pendentes</span>
                      </div>
                    </div>

                    {/* Filter & Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                          value={artStatusFilter}
                          onChange={(e) => setArtStatusFilter(e.target.value)}
                          className="bg-muted/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="all">Todas</option>
                          <option value="pending">Pendentes</option>
                          <option value="in_progress">Em andamento</option>
                          <option value="completed">Concluídas</option>
                          <option value="approved">Aprovadas</option>
                        </select>
                      </div>
                      {artsProgress.completed < artsProgress.total && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={markAllArtsAsCompleted}
                          className="glass border-white/10 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Concluir Todas
                        </Button>
                      )}
                    </div>

                    {/* Arts List */}
                    <div className="space-y-2">
                      {filteredArts.map(art => (
                        <div 
                          key={art.id} 
                          className="glass rounded-lg p-3 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                              art.status === 'completed' || art.status === 'approved' 
                                ? 'bg-emerald-400' 
                                : art.status === 'in_progress'
                                  ? 'bg-cyan-400'
                                  : 'bg-muted-foreground'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{art.name}</p>
                              <p className="text-xs text-muted-foreground">{art.art_type}</p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-200 flex items-center gap-1"
                                  >
                                    {artStatusLabels[art.status] || art.status}
                                    <ChevronDown className="h-3 w-3" />
                                  </Badge>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                Alterar status
                              </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="glass-card border-white/10">
                              <DropdownMenuItem onClick={() => onUpdateArtStatus(art.id, 'pending')}>
                                <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2" />
                                Pendente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateArtStatus(art.id, 'in_progress')}>
                                <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2" />
                                Em andamento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateArtStatus(art.id, 'completed')}>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                                Concluída
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateArtStatus(art.id, 'approved')}>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                                Aprovada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      
                      {filteredArts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma arte encontrada com esse filtro
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Time Tab */}
                <TabsContent value="time" className="mt-0 space-y-4 animate-fade-in">
                  {/* Time Summary */}
                  <div className="glass rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatTotalTime(projectTimeEntries)}</p>
                        <p className="text-sm text-muted-foreground">Tempo total trabalhado</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Time Entries */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Registros Recentes
                    </h4>
                    
                    {recentTimeEntries.length > 0 ? (
                      <div className="space-y-2">
                        {recentTimeEntries.map(entry => (
                          <div 
                            key={entry.id}
                            className="glass rounded-lg p-3 border border-white/5 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {entry.description || 'Sem descrição'}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 ml-3">
                              {entry.duration_minutes 
                                ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}min`
                                : '0min'
                              }
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm glass rounded-lg border border-white/5">
                        Nenhum registro de tempo encontrado
                      </div>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex gap-2 p-6 pt-4 border-t border-white/5">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="flex-1 glass border-white/10"
              >
                Fechar
              </Button>
              {project.google_drive_link && (
                <Button 
                  variant="outline"
                  className="glass border-white/10"
                  onClick={() => window.open(project.google_drive_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Drive
                </Button>
              )}
              <Button 
                onClick={() => { 
                  onOpenChange(false); 
                  onEdit(project); 
                }} 
                className="flex-1 gradient-primary glow-primary"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
