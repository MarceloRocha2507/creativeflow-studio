import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Phone, Users, Mail, 
  Send, FileText, Calendar
} from 'lucide-react';

const INTERACTION_TYPES = [
  { value: 'note', label: 'Nota', icon: FileText },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'proposal', label: 'Proposta', icon: Send },
];

interface AddInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    interaction_type: string;
    title: string;
    description: string;
    interaction_date: string;
  }) => Promise<void>;
}

export function AddInteractionDialog({ open, onOpenChange, onSubmit }: AddInteractionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [interactionType, setInteractionType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 16));

  const resetForm = () => {
    setInteractionType('note');
    setTitle('');
    setDescription('');
    setInteractionDate(new Date().toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        interaction_type: interactionType,
        title: title.trim(),
        description: description.trim(),
        interaction_date: new Date(interactionDate).toISOString(),
      });
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient">Nova Interação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Interação</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger className="glass border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                {INTERACTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass border-white/10"
              placeholder="Ex: Ligação de follow-up"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data e Hora</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="date"
                type="datetime-local"
                value={interactionDate}
                onChange={(e) => setInteractionDate(e.target.value)}
                className="glass border-white/10 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass border-white/10"
              placeholder="Detalhes da interação..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="glass border-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary glow-primary"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
