import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Trash2, Eye, Package, Calendar, DollarSign, User, AlertCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusColors, statusLabels, statusAccentColors } from '@/lib/projectStatus';

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
    return { text: `${Math.abs(days)}d atrasado`, color: 'text-red-400 bg-red-500/10', icon: true };
  } else if (days === 0) {
    return { text: 'Hoje', color: 'text-red-400 bg-red-500/10', icon: true };
  } else if (days <= 3) {
    return { text: `em ${days}d`, color: 'text-amber-400 bg-amber-500/10', icon: false };
  } else if (days <= 7) {
    return { text: `em ${days}d`, color: 'text-yellow-400 bg-yellow-500/10', icon: false };
  } else {
    return { text: `em ${days}d`, color: 'text-muted-foreground', icon: false };
  }
}

export function ProjectCard({ project, index, completedArts = 0, onView, onEdit, onDelete }: ProjectCardProps) {
  const deadlineInfo = getDeadlineInfo(project.deadline, project.status);
  const totalArts = project.package_total_arts || 0;
  const progressPercent = totalArts > 0 ? (completedArts / totalArts) * 100 : 0;
  const showPriorityBadge = project.priority === 'high' || project.priority === 'urgent';
  
  const value = project.project_type === 'package' 
    ? project.package_total_value 
    : project.budget || project.hourly_rate;

  return (
    <Card 
      className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:border-primary/40 hover:bg-card/80 cursor-pointer active:scale-[0.98] relative overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onView(project)}
    >
      {/* Status accent strip on left side */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccentColors[project.status] || 'bg-muted-foreground'}`} />
      
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg truncate">{project.name}</CardTitle>
            {showPriorityBadge && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className={`h-4 w-4 shrink-0 ${project.priority === 'urgent' ? 'text-red-400' : 'text-orange-400'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  {project.priority === 'urgent' ? 'Prioridade Urgente' : 'Prioridade Alta'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {project.clients?.name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span className="truncate">{project.clients.name}</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card border-white/10">
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[project.status] || 'bg-muted/50 text-muted-foreground border-border/50'}>
            {statusLabels[project.status] || project.status}
          </Badge>
          {project.project_type === 'package' && (
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
              <Package className="h-3 w-3 mr-1" />
              {project.package_total_arts} artes
            </Badge>
          )}
        </div>

        {/* Progress bar for packages */}
        {project.project_type === 'package' && totalArts > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary">{completedArts}/{totalArts}</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          {/* Deadline with color indicator */}
          {project.deadline ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${deadlineInfo?.color || 'text-muted-foreground'}`}>
                  {deadlineInfo?.icon && <Clock className="h-3.5 w-3.5" />}
                  {!deadlineInfo?.icon && <Calendar className="h-3.5 w-3.5" />}
                  <span className="text-xs font-medium">
                    {deadlineInfo?.text || format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Prazo: {format(new Date(project.deadline), "dd 'de' MMMM", { locale: ptBR })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span />
          )}
          
          {value ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <DollarSign className="h-4 w-4" />
              R$ {value.toLocaleString('pt-BR')}
              {project.billing_type === 'hourly' && '/h'}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
