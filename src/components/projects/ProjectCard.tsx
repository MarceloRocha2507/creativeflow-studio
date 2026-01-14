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
      className="group relative overflow-hidden cursor-pointer transition-all duration-500 ease-out
        bg-gradient-to-br from-card/80 via-card/60 to-card/40
        backdrop-blur-xl backdrop-saturate-150
        border border-white/10 hover:border-white/20
        rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.2),0_0_40px_rgba(var(--primary-rgb),0.15),inset_0_1px_0_rgba(255,255,255,0.15)]
        hover:scale-[1.02] hover:-translate-y-1
        active:scale-[0.98] active:translate-y-0"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onView(project)}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
      
      {/* Status accent strip with glow effect */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusAccentColors[project.status] || 'bg-muted-foreground'}`}>
        <div className={`absolute inset-0 blur-sm ${statusAccentColors[project.status] || 'bg-muted-foreground'} opacity-60`} />
      </div>
      
      <CardHeader className="relative flex flex-row items-start justify-between pb-2 pl-6">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-lg font-semibold tracking-tight truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {project.name}
            </CardTitle>
            {showPriorityBadge && (
              <Tooltip>
                <TooltipTrigger>
                  <div className={`p-1 rounded-full ${project.priority === 'urgent' ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                    <AlertCircle className={`h-3.5 w-3.5 shrink-0 ${project.priority === 'urgent' ? 'text-red-400' : 'text-orange-400'}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-popover/90 backdrop-blur-md border-white/10">
                  {project.priority === 'urgent' ? 'Prioridade Urgente' : 'Prioridade Alta'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {project.clients?.name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
              <div className="p-1 rounded-full bg-primary/10">
                <User className="h-3 w-3 text-primary/80 shrink-0" />
              </div>
              <span className="truncate font-medium">{project.clients.name}</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 
                hover:bg-white/10 rounded-xl backdrop-blur-sm"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-popover/80 backdrop-blur-xl border-white/10 rounded-xl shadow-xl"
          >
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onView(project); }}
              className="rounded-lg focus:bg-white/10"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
              className="rounded-lg focus:bg-white/10"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
              className="text-destructive focus:text-destructive rounded-lg focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="relative space-y-4 pl-6">
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={`${statusColors[project.status] || 'bg-muted/50 text-muted-foreground border-border/50'} 
              backdrop-blur-sm rounded-lg px-3 py-1 font-medium shadow-sm`}
          >
            {statusLabels[project.status] || project.status}
          </Badge>
          {project.project_type === 'package' && (
            <Badge 
              variant="outline" 
              className="bg-violet-500/15 text-violet-300 border-violet-500/30 backdrop-blur-sm rounded-lg px-3 py-1"
            >
              <Package className="h-3 w-3 mr-1.5" />
              {project.package_total_arts} artes
            </Badge>
          )}
        </div>

        {/* Progress bar for packages with glassmorphism */}
        {project.project_type === 'package' && totalArts > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/80">Progresso</span>
              <span className="text-primary font-semibold">{completedArts}/{totalArts}</span>
            </div>
            <div className="relative h-2 rounded-full bg-black/20 overflow-hidden backdrop-blur-sm">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
        )}

        {/* Footer with deadline and value */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
          {/* Deadline with glassmorphism pill */}
          {project.deadline ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm ${deadlineInfo?.color || 'text-muted-foreground bg-muted/20'}`}>
                  {deadlineInfo?.icon && <Clock className="h-3.5 w-3.5" />}
                  {!deadlineInfo?.icon && <Calendar className="h-3.5 w-3.5" />}
                  <span className="text-xs font-semibold">
                    {deadlineInfo?.text || format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-popover/90 backdrop-blur-md border-white/10">
                Prazo: {format(new Date(project.deadline), "dd 'de' MMMM", { locale: ptBR })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span />
          )}
          
          {value ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 backdrop-blur-sm">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                R$ {value.toLocaleString('pt-BR')}
                {project.billing_type === 'hourly' && '/h'}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
