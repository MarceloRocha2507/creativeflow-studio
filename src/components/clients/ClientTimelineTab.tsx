import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, History } from 'lucide-react';
import { AddInteractionDialog } from './AddInteractionDialog';
import { InteractionItem } from './InteractionItem';

interface Interaction {
  id: string;
  interaction_type: string;
  title: string;
  description: string | null;
  interaction_date: string;
  created_at: string;
}

interface ClientTimelineTabProps {
  interactions: Interaction[];
  onAddInteraction: (data: {
    interaction_type: string;
    title: string;
    description: string;
    interaction_date: string;
  }) => Promise<void>;
  onDeleteInteraction: (id: string) => Promise<void>;
}

export function ClientTimelineTab({ 
  interactions, 
  onAddInteraction, 
  onDeleteInteraction 
}: ClientTimelineTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAdd = async (data: {
    interaction_type: string;
    title: string;
    description: string;
    interaction_date: string;
  }) => {
    await onAddInteraction(data);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Timeline de Interações
        </h3>
        <Button 
          className="gradient-primary gap-2 glow-primary"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Interação
        </Button>
      </div>

      {/* Timeline */}
      {interactions.length === 0 ? (
        <Card className="glass-card border-white/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma interação registrada.
            </p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setIsDialogOpen(true)}
            >
              Registrar primeira interação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
          
          {/* Interactions */}
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <InteractionItem 
                key={interaction.id} 
                interaction={interaction}
                isFirst={index === 0}
                onDelete={() => onDeleteInteraction(interaction.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <AddInteractionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAdd}
      />
    </div>
  );
}
