import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Calendar, DollarSign, Package, 
  ExternalLink, Filter, FolderOpen
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectArt {
  id: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  budget: number | null;
  package_total_value: number | null;
  project_type: string;
  deadline: string | null;
  created_at: string;
  project_arts?: ProjectArt[];
}

interface ClientProjectsTabProps {
  projects: Project[];
  clientId: string;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted/50 text-muted-foreground border-border/50',
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
  low: 'bg-muted/50 text-muted-foreground border-border/50',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export function ClientProjectsTab({ projects, clientId }: ClientProjectsTabProps) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = statusFilter === 'all' 
    ? projects 
    : projects.filter(p => p.status === statusFilter);

  const getProjectValue = (project: Project) => {
    if (project.package_total_value) return project.package_total_value;
    if (project.budget) return project.budget;
    return 0;
  };

  const getArtsProgress = (arts?: ProjectArt[]) => {
    if (!arts || arts.length === 0) return null;
    const completed = arts.filter(a => a.status === 'completed' || a.status === 'approved').length;
    return {
      completed,
      total: arts.length,
      percentage: Math.round((completed / arts.length) * 100),
    };
  };

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'completed' || status === 'cancelled') return false;
    return isPast(new Date(deadline));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 glass border-white/10">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          className="gradient-primary gap-2 glow-primary"
          onClick={() => navigate(`/projects?new=true&client=${clientId}`)}
        >
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="glass-card border-white/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {statusFilter === 'all' 
                ? 'Nenhum projeto encontrado para este cliente.' 
                : 'Nenhum projeto com este status.'}
            </p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => navigate(`/projects?new=true&client=${clientId}`)}
            >
              Criar primeiro projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map(project => {
            const artsProgress = getArtsProgress(project.project_arts);
            const value = getProjectValue(project);
            const overdue = isOverdue(project.deadline, project.status);

            return (
              <Card 
                key={project.id} 
                className="glass-card border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                onClick={() => navigate('/projects')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={statusColors[project.status]}>
                          {statusLabels[project.status]}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[project.priority]}>
                          {priorityLabels[project.priority]}
                        </Badge>
                        {project.project_type === 'package' && (
                          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                            <Package className="h-3 w-3 mr-1" />
                            Pacote
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {/* Value */}
                    {value > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">
                          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* Deadline */}
                    {project.deadline && (
                      <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                        <Calendar className="h-4 w-4" />
                        <span>
                          {overdue && 'Atrasado: '}
                          {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {/* Arts Progress */}
                    {artsProgress && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Artes</span>
                          <span>{artsProgress.completed}/{artsProgress.total}</span>
                        </div>
                        <Progress value={artsProgress.percentage} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
