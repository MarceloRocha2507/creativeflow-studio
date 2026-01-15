// Unified project status configuration
// Used by both Projects.tsx and ProjectDetailsDialog.tsx for consistency

export const statusColors: Record<string, string> = {
  not_started: 'bg-muted/50 text-muted-foreground border-muted',
  in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  paused: 'bg-muted/50 text-muted-foreground border-border/50',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const statusLabels: Record<string, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Andamento',
  pending_approval: 'Enviado para Aprovação',
  on_hold: 'Pausado',
  paused: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

// Accent colors for card left strips (solid colors)
export const statusAccentColors: Record<string, string> = {
  not_started: 'bg-muted-foreground',
  in_progress: 'bg-cyan-400',
  pending_approval: 'bg-amber-400',
  on_hold: 'bg-yellow-400',
  paused: 'bg-muted-foreground',
  completed: 'bg-emerald-400',
  cancelled: 'bg-red-400',
};

export const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const artStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  pending_approval: 'Enviado para Aprovação',
  completed: 'Concluída',
  approved: 'Aprovada',
};

export const artStatusColors: Record<string, string> = {
  pending: 'bg-muted-foreground',
  in_progress: 'bg-cyan-400',
  pending_approval: 'bg-amber-400',
  completed: 'bg-emerald-400',
  approved: 'bg-emerald-400',
};
