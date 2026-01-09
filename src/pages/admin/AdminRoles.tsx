import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Search, Key, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'user';
}

export default function AdminRoles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    user: UserWithRole;
    action: 'promote' | 'demote';
  } | null>(null);
  
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-with-roles'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .order('full_name');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return (profiles || []).map(p => ({
        ...p,
        role: (rolesMap.get(p.user_id) as 'admin' | 'user') || 'user',
      })) as UserWithRole[];
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: 'admin' as const
        }, { 
          onConflict: 'user_id,role' 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      toast.success('Usuário promovido a administrador');
    },
    onError: (error) => {
      toast.error('Erro ao promover usuário: ' + error.message);
    },
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      toast.success('Permissão de administrador removida');
    },
    onError: (error) => {
      toast.error('Erro ao remover permissão: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.action === 'promote') {
      promoteMutation.mutate(confirmAction.user.user_id);
    } else {
      demoteMutation.mutate(confirmAction.user.user_id);
    }
    setConfirmAction(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            Gerenciar Permissões
          </h1>
          <p className="text-muted-foreground">
            Promova ou remova permissões de administrador
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role Atual</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "Sem nome"}
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.user_id === currentUser?.id ? (
                          <span className="text-sm text-muted-foreground">Você</span>
                        ) : user.role === 'admin' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ user, action: 'demote' })}
                            className="text-destructive hover:text-destructive"
                          >
                            <ShieldX className="h-4 w-4 mr-1" />
                            Remover Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ user, action: 'promote' })}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Promover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.action === 'promote' 
                  ? 'Promover a Administrador' 
                  : 'Remover Permissão de Administrador'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.action === 'promote'
                  ? `Deseja promover "${confirmAction?.user.full_name || confirmAction?.user.email}" para administrador? Isso dará acesso completo ao painel administrativo.`
                  : `Deseja remover a permissão de administrador de "${confirmAction?.user.full_name || confirmAction?.user.email}"? O usuário perderá acesso ao painel administrativo.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
