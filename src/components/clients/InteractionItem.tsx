import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, Phone, Users, Mail, 
  Send, FileText, Trash2, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const INTERACTION_ICONS: Record<string, React.ElementType> = {
  note: FileText,
  call: Phone,
  meeting: Users,
  email: Mail,
  whatsapp: MessageSquare,
  proposal: Send,
};

const INTERACTION_COLORS: Record<string, string> = {
  note: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  call: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  meeting: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  email: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  whatsapp: 'bg-green-500/10 text-green-400 border-green-500/30',
  proposal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

const INTERACTION_LABELS: Record<string, string> = {
  note: 'Nota',
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  proposal: 'Proposta',
};

interface Interaction {
  id: string;
  interaction_type: string;
  title: string;
  description: string | null;
  interaction_date: string;
  created_at: string;
}

interface InteractionItemProps {
  interaction: Interaction;
  isFirst: boolean;
  onDelete: () => void;
}

export function InteractionItem({ interaction, isFirst, onDelete }: InteractionItemProps) {
  const Icon = INTERACTION_ICONS[interaction.interaction_type] || FileText;
  const colorClass = INTERACTION_COLORS[interaction.interaction_type] || 'bg-muted/50 text-muted-foreground';
  const label = INTERACTION_LABELS[interaction.interaction_type] || interaction.interaction_type;

  return (
    <div className="relative pl-14">
      {/* Icon circle */}
      <div className={`absolute left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center border ${colorClass} z-10`}>
        <Icon className="h-3 w-3" />
      </div>

      <Card className={`glass-card border-white/5 hover:border-white/10 transition-colors ${isFirst ? 'ring-1 ring-primary/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(interaction.interaction_date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <h4 className="font-semibold mt-2">{interaction.title}</h4>
              {interaction.description && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {interaction.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/10">
                <DropdownMenuItem 
                  className="text-red-400 focus:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
