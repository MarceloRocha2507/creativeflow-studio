import { cn } from '@/lib/utils';

interface StatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
  activeColor: string;
}

interface StatusChipsProps {
  projects: { status: string }[];
  activeStatus: string;
  onStatusChange: (status: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; activeColor: string }> = {
  all: { label: 'Todos', color: 'bg-muted/50 text-muted-foreground border-border/50', activeColor: 'bg-primary/20 text-primary border-primary/40' },
  in_progress: { label: 'Em andamento', color: 'bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20', activeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  pending_approval: { label: 'Enviado p/ Aprovação', color: 'bg-amber-500/10 text-amber-400/70 border-amber-500/20', activeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  completed: { label: 'Concluídos', color: 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20', activeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  paused: { label: 'Pausados', color: 'bg-muted/30 text-muted-foreground/70 border-border/30', activeColor: 'bg-muted/50 text-muted-foreground border-border/50' },
  cancelled: { label: 'Cancelados', color: 'bg-red-500/10 text-red-400/70 border-red-500/20', activeColor: 'bg-red-500/20 text-red-400 border-red-500/40' },
};

export function StatusChips({ projects, activeStatus, onStatusChange }: StatusChipsProps) {
  const statusCounts = Object.entries(statusConfig).map(([status, config]) => {
    const count = status === 'all' 
      ? projects.length 
      : projects.filter(p => p.status === status).length;
    
    return { status, ...config, count };
  });

  // Only show statuses that have projects (except 'all' which is always shown)
  const visibleStatuses = statusCounts.filter(s => s.status === 'all' || s.count > 0);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {visibleStatuses.map(({ status, label, count, color, activeColor }) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap shrink-0',
            activeStatus === status ? activeColor : color,
            'hover:scale-105 active:scale-95'
          )}
        >
          <span>{label}</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            activeStatus === status ? 'bg-background/20' : 'bg-background/10'
          )}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
