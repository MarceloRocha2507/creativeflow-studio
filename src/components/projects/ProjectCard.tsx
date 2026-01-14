import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Trash2, Eye, Package, Calendar, DollarSign, User, AlertCircle, Clock, Briefcase } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusColors, statusLabels, statusAccentColors, priorityLabels } from '@/lib/projectStatus';

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  project_type: string;
  billing_type: string;
  package_total_arts: number | null;
  package_total_value: number | null;
  budget: number | null;
  hourly_rate: number | null;
  deadline: string | null;
  start_date?: string | null;
  description?: string | null;
  clients?: { name: string } | null;
}

interface ProjectCardProps {
  project: Project;
  index: number;
  completedArts?: number;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

function getDeadlineInfo(deadline: string | null, status: string) {
  if (!deadline || status === 'completed' || status === 'cancelled') return null;
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInDays(deadlineDate, today);
  
  if (days < 0) {
    return { text: `${Math.abs(days)}d atrasado`, color: 'text-red-400 bg-red-500/15', icon: true, urgent: true };
  } else if (days === 0) {
    return { text: 'Hoje', color: 'text-red-400 bg-red-500/15', icon: true, urgent: true };
  } else if (days <= 3) {
    return { text: `em ${days}d`, color: 'text-amber-400 bg-amber-500/15', icon: false, urgent: false };
  } else if (days <= 7) {
    return { text: `em ${days}d`, color: 'text-yellow-400 bg-yellow-500/15', icon: false, urgent: false };
  } else {
    return { text: `em ${days}d`, color: 'text-muted-foreground bg-muted/30', icon: false, urgent: false };
  }
}

function getBillingTypeLabel(type: string) {
  const labels: Record<string, string> = {
    fixed: 'Valor fixo',
    hourly: 'Por hora',
    package: 'Pacote'
  };
  return labels[type] || type;
}

export function ProjectCard({ project, index, completedArts = 0, onView, onEdit, onDelete }: ProjectCardProps) {
  const deadlineInfo = getDeadlineInfo(project.deadline, project.status);
  const totalArts = project.package_total_arts || 0;
  const progressPercent = totalArts > 0 ? (completedArts / totalArts) * 100 : 0;
  
  const value = project.project_type === 'package' 
    ? project.package_total_value 
    : project.budget || project.hourly_rate;

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer bg-card border border-border rounded-lg"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onView(project)}
    >
      {/* Status accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccentColors[project.status] || 'bg-muted-foreground'}`} />
      
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold truncate">
              {project.name}
            </CardTitle>
          </div>
          {project.clients?.name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.clients.name}</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project); }}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-3 pl-5">
        {/* Description preview */}
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Status and Priority row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant="outline" 
            className={statusColors[project.status] || 'bg-muted/50 text-muted-foreground border-border/50'}
          >
            {statusLabels[project.status] || project.status}
          </Badge>
          
          {(project.priority === 'high' || project.priority === 'urgent') && (
            <Badge 
              variant="outline" 
              className={project.priority === 'urgent' 
                ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {priorityLabels[project.priority]}
            </Badge>
          )}

          {project.project_type === 'package' && (
            <Badge variant="outline" className="bg-violet-500/15 text-violet-400 border-violet-500/30">
              <Package className="h-3 w-3 mr-1" />
              {project.package_total_arts} artes
            </Badge>
          )}
        </div>

        {/* Project type and billing info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            <span>{getBillingTypeLabel(project.billing_type)}</span>
          </div>
          {project.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Início: {format(new Date(project.start_date), 'dd/MM/yy', { locale: ptBR })}</span>
            </div>
          )}
        </div>

        {/* Progress bar for packages */}
        {project.project_type === 'package' && totalArts > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso das artes</span>
              <span className="font-medium">{completedArts}/{totalArts} concluídas</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Footer with deadline and value */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Deadline */}
          {project.deadline ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${deadlineInfo?.color || 'text-muted-foreground'}`}>
                  {deadlineInfo?.icon ? <Clock className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                  <span>{deadlineInfo?.text || format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Prazo: {format(new Date(project.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-xs text-muted-foreground">Sem prazo</span>
          )}
          
          {/* Value */}
          {value ? (
            <div className="flex items-center gap-1 text-emerald-500 font-semibold text-sm">
              <DollarSign className="h-4 w-4" />
              <span>
                R$ {value.toLocaleString('pt-BR')}
                {project.billing_type === 'hourly' && '/h'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sem valor</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
