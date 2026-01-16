import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Pencil, Trash2, Eye, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusColors, statusLabels, priorityLabels, priorityColors } from '@/lib/projectStatus';
import { cn } from '@/lib/utils';

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
    return { text: `${Math.abs(days)}d atrasado`, variant: 'destructive' as const, urgent: true };
  } else if (days === 0) {
    return { text: 'Hoje', variant: 'destructive' as const, urgent: true };
  } else if (days <= 3) {
    return { text: `${days}d`, variant: 'warning' as const, urgent: false };
  } else if (days <= 7) {
    return { text: `${days}d`, variant: 'secondary' as const, urgent: false };
  } else {
    return { text: `${days}d`, variant: 'outline' as const, urgent: false };
  }
}

export function ProjectCard({ project, index, completedArts = 0, onView, onEdit, onDelete }: ProjectCardProps) {
  const deadlineInfo = getDeadlineInfo(project.deadline, project.status);
  const totalArts = project.package_total_arts || 0;
  const progressPercent = totalArts > 0 ? (completedArts / totalArts) * 100 : 0;
  
  const value = project.project_type === 'package' 
    ? project.package_total_value 
    : project.budget || project.hourly_rate;

  // Status dot color
  const statusDotColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    pending_approval: 'bg-purple-500',
    revision: 'bg-orange-500',
    approved: 'bg-emerald-500',
    completed: 'bg-green-500',
    cancelled: 'bg-gray-500',
  };

  return (
    <Card 
      className="group cursor-pointer bg-card border-border hover:border-primary/30 transition-all duration-150"
      onClick={() => onView(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Status dot */}
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0',
                statusDotColors[project.status] || 'bg-muted-foreground'
              )} />
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
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={statusColors[project.status]}>
            {statusLabels[project.status] || project.status}
          </Badge>
          
          {(project.priority === 'high' || project.priority === 'urgent') && (
            <Badge variant="outline" className={priorityColors[project.priority]}>
              {priorityLabels[project.priority]}
            </Badge>
          )}

          {project.project_type === 'package' && (
            <Badge variant="secondary" className="text-xs">
              {completedArts}/{totalArts} artes
            </Badge>
          )}
        </div>

        {/* Progress bar for packages */}
        {project.project_type === 'package' && totalArts > 0 && (
          <Progress value={progressPercent} className="h-1.5" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Deadline */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {project.deadline ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    'flex items-center gap-1',
                    deadlineInfo?.urgent && 'text-destructive'
                  )}>
                    {deadlineInfo?.urgent ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs font-medium">{deadlineInfo?.text}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(project.deadline), "dd 'de' MMMM", { locale: ptBR })}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs">Sem prazo</span>
            )}
          </div>
          
          {/* Value */}
          {value ? (
            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
              <span>
                R$ {value.toLocaleString('pt-BR')}
                {project.billing_type === 'hourly' && '/h'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
