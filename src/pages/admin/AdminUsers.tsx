import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, Eye, UserPlus, RefreshCw, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserStatusBadge } from "@/components/admin/UserStatusBadge";
import { PlanBadge } from "@/components/admin/PlanBadge";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { RenewPlanDialog } from "@/components/admin/RenewPlanDialog";
import { DeactivateUserDialog } from "@/components/admin/DeactivateUserDialog";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  business_name: string | null;
  is_active: boolean | null;
}

interface UserSubscription {
  user_id: string;
  plan_type: string;
  end_date: string | null;
  status: string;
}

interface UserDetails {
  profile: UserProfile;
  projectsCount: number;
  tasksCount: number;
  totalHours: number;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [renewPlanUser, setRenewPlanUser] = useState<{
    userId: string;
    userName: string;
    currentPlan?: string;
    currentEndDate?: string | null;
  } | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<{
    userId: string;
    userName: string;
    isActive: boolean;
  } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id, role');
      return data || [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*');
      return (data || []) as UserSubscription[];
    },
  });

  const getRoleForUser = (userId: string) => {
    const role = userRoles?.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getSubscriptionForUser = (userId: string) => {
    return subscriptions?.find(s => s.user_id === userId);
  };

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewUser = async (user: UserProfile) => {
    const [projectsRes, tasksRes, timeEntriesRes] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
      supabase.from('time_entries').select('duration_minutes').eq('user_id', user.user_id),
    ]);

    const totalHours = (timeEntriesRes.data || []).reduce(
      (acc, entry) => acc + (entry.duration_minutes || 0), 0
    ) / 60;

    setSelectedUser({
      profile: user,
      projectsCount: projectsRes.count || 0,
      tasksCount: tasksRes.count || 0,
      totalHours: Math.round(totalHours),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground">
              {users?.length || 0} usuários cadastrados
            </p>
          </div>
          <Button onClick={() => setAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const subscription = getSubscriptionForUser(user.user_id);
                    const isActive = user.is_active !== false;
                    const isCurrentUserAdmin = getRoleForUser(user.user_id) === 'admin';
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "Sem nome"}
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={isCurrentUserAdmin ? 'default' : 'secondary'}>
                            {getRoleForUser(user.user_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <PlanBadge
                            planType={subscription?.plan_type || 'free'}
                            endDate={subscription?.end_date}
                          />
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge isActive={isActive} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRenewPlanUser({
                                userId: user.user_id,
                                userName: user.full_name || user.email || 'Usuário',
                                currentPlan: subscription?.plan_type,
                                currentEndDate: subscription?.end_date,
                              })}
                              title="Renovar plano"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            {user.user_id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeactivateUser({
                                  userId: user.user_id,
                                  userName: user.full_name || user.email || 'Usuário',
                                  isActive,
                                })}
                                title={isActive ? "Desativar usuário" : "Ativar usuário"}
                                className={isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}
                              >
                                {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedUser.profile.full_name || "Sem nome"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.profile.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{selectedUser.profile.business_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">
                      {format(new Date(selectedUser.profile.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedUser.projectsCount}</p>
                      <p className="text-sm text-muted-foreground">Projetos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedUser.tasksCount}</p>
                      <p className="text-sm text-muted-foreground">Tarefas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedUser.totalHours}h</p>
                      <p className="text-sm text-muted-foreground">Horas</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />

        {/* Renew Plan Dialog */}
        {renewPlanUser && (
          <RenewPlanDialog
            open={!!renewPlanUser}
            onOpenChange={() => setRenewPlanUser(null)}
            userId={renewPlanUser.userId}
            userName={renewPlanUser.userName}
            currentPlan={renewPlanUser.currentPlan}
            currentEndDate={renewPlanUser.currentEndDate}
          />
        )}

        {/* Deactivate User Dialog */}
        {deactivateUser && (
          <DeactivateUserDialog
            open={!!deactivateUser}
            onOpenChange={() => setDeactivateUser(null)}
            userId={deactivateUser.userId}
            userName={deactivateUser.userName}
            isActive={deactivateUser.isActive}
          />
        )}
      </div>
    </AppLayout>
  );
}
