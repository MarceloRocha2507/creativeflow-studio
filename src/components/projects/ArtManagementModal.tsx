import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Image, CheckCircle2, Clock, Play, Pencil, Save, X } from 'lucide-react';

// Tipos de arte disponíveis
export const ART_TYPES = [
  { value: 'feed', label: 'Feed' },
  { value: 'story', label: 'Story' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'banner', label: 'Banner' },
  { value: 'logo', label: 'Logo' },
  { value: 'reels', label: 'Reels' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'outro', label: 'Outro' },
];

// Função para gerar nome de arte no padrão
export const generateArtName = (projectName: string, artType: string, index: number): string => {
  const typeLabel = ART_TYPES.find(t => t.value === artType)?.label || 'Arte';
  const artNumber = String(index).padStart(2, '0');
  return `${projectName} - ${typeLabel} - Arte ${artNumber}`;
};

// Função para gerar múltiplas artes
export const generateArtNames = (projectName: string, artType: string, totalArts: number): string[] => {
  return Array.from({ length: totalArts }, (_, index) => 
    generateArtName(projectName, artType, index + 1)
  );
};

interface ProjectArt {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  status: string;
  art_type: string;
}

interface Project {
  id: string;
  name: string;
  package_total_arts: number | null;
  project_arts?: ProjectArt[];
}

interface ArtManagementModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ArtManagementModal({ project, open, onOpenChange, onUpdate }: ArtManagementModalProps) {
  const [arts, setArts] = useState<ProjectArt[]>([]);
  const [editingArtId, setEditingArtId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (project && open) {
      fetchArts();
    }
  }, [project, open]);

  const fetchArts = async () => {
    if (!project) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('project_arts')
      .select('*')
      .eq('project_id', project.id)
      .order('order_index', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar artes', description: error.message });
    } else {
      setArts(data || []);
    }
    setIsLoading(false);
  };

  const handleUpdateArt = async (artId: string, updates: Partial<ProjectArt>) => {
    const { error } = await supabase
      .from('project_arts')
      .update(updates)
      .eq('id', artId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar arte', description: error.message });
    } else {
      setArts(arts.map(art => art.id === artId ? { ...art, ...updates } : art));
      onUpdate();
    }
  };

  const handleSaveName = async (artId: string) => {
    if (!editingName.trim()) return;
    await handleUpdateArt(artId, { name: editingName.trim() });
    setEditingArtId(null);
    setEditingName('');
  };

  const startEditing = (art: ProjectArt) => {
    setEditingArtId(art.id);
    setEditingName(art.name);
  };

  const cancelEditing = () => {
    setEditingArtId(null);
    setEditingName('');
  };

  const completedArts = arts.filter(art => art.status === 'completed').length;
  const totalArts = arts.length;
  const progressPercent = totalArts > 0 ? (completedArts / totalArts) * 100 : 0;

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { 
      label: 'Pendente', 
      icon: <Clock className="h-3.5 w-3.5" />, 
      className: 'bg-muted/50 text-muted-foreground border-border/50' 
    },
    in_progress: { 
      label: 'Em Andamento', 
      icon: <Play className="h-3.5 w-3.5" />, 
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
    },
    completed: { 
      label: 'Concluído', 
      icon: <CheckCircle2 className="h-3.5 w-3.5" />, 
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
    },
  };

  const getNextStatus = (currentStatus: string): string => {
    const statusCycle = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    return statusCycle[(currentIndex + 1) % statusCycle.length];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeader className="pb-4 border-b border-white/10">
          <DialogTitle className="text-gradient flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gerenciar Artes - {project?.name}
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedArts}/{totalArts} artes concluídas
              </span>
              <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : arts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma arte encontrada
            </div>
          ) : (
            arts.map((art, index) => (
              <div 
                key={art.id} 
                className="flex items-center gap-3 p-3 rounded-lg glass border border-white/10 hover:border-primary/30 transition-colors"
              >
                {/* Order number */}
                <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-muted-foreground bg-white/5 rounded">
                  {String(art.order_index).padStart(2, '0')}
                </span>

                {/* Name - editable */}
                <div className="flex-1 min-w-0">
                  {editingArtId === art.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="glass border-white/10 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(art.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleSaveName(art.id)}>
                        <Save className="h-3.5 w-3.5 text-emerald-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEditing}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/name">
                      <span className="text-sm truncate">{art.name}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
                        onClick={() => startEditing(art)}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Art Type Select */}
                <Select 
                  value={art.art_type || 'feed'} 
                  onValueChange={(value) => handleUpdateArt(art.id, { art_type: value })}
                >
                  <SelectTrigger className="w-28 glass border-white/10 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    {ART_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value} className="text-sm">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Badge - clickable to cycle */}
                <Badge 
                  variant="outline" 
                  className={`${statusConfig[art.status]?.className || statusConfig.pending.className} cursor-pointer hover:opacity-80 transition-opacity shrink-0`}
                  onClick={() => handleUpdateArt(art.id, { status: getNextStatus(art.status) })}
                >
                  {statusConfig[art.status]?.icon}
                  <span className="ml-1 text-xs hidden sm:inline">{statusConfig[art.status]?.label}</span>
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="glass border-white/10"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
