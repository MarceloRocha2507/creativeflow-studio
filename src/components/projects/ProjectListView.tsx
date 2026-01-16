import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Eye, Package, Calendar, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusColors, statusLabels, priorityColors, priorityLabels } from '@/lib/projectStatus';

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  project_type: string;
  package_total_arts: number | null;
  package_total_value: number | null;
  budget: number | null;
  hourly_rate: number | null;
  deadline: string | null;
  clients?: { name: string } | null;
}

interface ProjectListViewProps {
  projects: Project[];
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onComplete?: (id: string) => void;
  onReopen?: (id: string) => void;
}

function getDeadlineInfo(deadline: string | null) {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInDays(deadlineDate, today);
  
  if (days < 0) {
    return { text: `${Math.abs(days)}d atrasado`, color: 'text-red-400', urgent: true };
  } else if (days === 0) {
    return { text: 'Hoje', color: 'text-red-400', urgent: true };
  } else if (days <= 3) {
    return { text: `${days}d`, color: 'text-amber-400', urgent: false };
  } else if (days <= 7) {
    return { text: `${days}d`, color: 'text-yellow-400', urgent: false };
  } else {
    return { text: `${days}d`, color: 'text-muted-foreground', urgent: false };
  }
}

export function ProjectListView({ projects, onView, onEdit, onDelete, onComplete, onReopen }: ProjectListViewProps) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="text-muted-foreground">Nome</TableHead>
            <TableHead className="text-muted-foreground hidden sm:table-cell">Cliente</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Prazo</TableHead>
            <TableHead className="text-muted-foreground hidden lg:table-cell text-right">Valor</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const deadlineInfo = getDeadlineInfo(project.deadline);
            const value = project.project_type === 'package' 
              ? project.package_total_value 
              : project.budget || project.hourly_rate;
              
            return (
              <TableRow 
                key={project.id} 
                className={`border-white/5 cursor-pointer hover:bg-muted/30 transition-colors ${
                  project.status === 'completed' ? 'opacity-70 bg-emerald-500/5' : ''
                }`}
                onClick={() => onView(project)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{project.name}</span>
                    {project.project_type === 'package' && (
                      <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {project.package_total_arts}
                      </Badge>
                    )}
                    {(project.priority === 'high' || project.priority === 'urgent') && (
                      <AlertCircle className={`h-4 w-4 shrink-0 ${project.priority === 'urgent' ? 'text-red-400' : 'text-orange-400'}`} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {project.clients?.name || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[project.status] || 'bg-muted/50 text-muted-foreground border-border/50'}>
                    {statusLabels[project.status] || project.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {project.deadline ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(project.deadline), 'dd/MM', { locale: ptBR })}
                      </span>
                      {deadlineInfo && project.status !== 'completed' && project.status !== 'cancelled' && (
                        <span className={`text-xs ${deadlineInfo.color}`}>
                          ({deadlineInfo.text})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right text-emerald-400">
                  {value ? `R$ ${value.toLocaleString('pt-BR')}` : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      {project.status !== 'completed' && project.status !== 'cancelled' && onComplete && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onComplete(project.id); }}
                          className="text-emerald-500 focus:text-emerald-500"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar como Concluído
                        </DropdownMenuItem>
                      )}
                      {project.status === 'completed' && onReopen && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onReopen(project.id); }}
                          className="text-cyan-500 focus:text-cyan-500"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reabrir Projeto
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
