import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  isActive: boolean;
}

export function DeactivateUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  isActive,
}: DeactivateUserDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId);

      if (error) throw error;

      // Log action
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: isActive ? 'deactivate_user' : 'activate_user',
        entity_type: 'user',
        entity_id: userId,
        details: { user_name: userName, new_status: !isActive },
      });
    },
    onSuccess: () => {
      toast.success(isActive ? "Usuário desativado com sucesso!" : "Usuário ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Desativar Usuário" : "Ativar Usuário"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? `Tem certeza que deseja desativar o usuário "${userName}"? O usuário não poderá mais acessar o sistema.`
              : `Tem certeza que deseja ativar o usuário "${userName}"? O usuário voltará a ter acesso ao sistema.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => toggleStatusMutation.mutate()}
            className={isActive ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isActive ? "Desativar" : "Ativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
