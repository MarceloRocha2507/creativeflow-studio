import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText, Search, Eye, Calendar, User, Filter } from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogActionBadge } from "@/components/admin/LogActionBadge";
import { LogDetailsModal } from "@/components/admin/LogDetailsModal";
import { getEntityTypeLabel, formatLogDetails, getRelativeTime, getActionConfig } from "@/lib/logUtils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type LogEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
};

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as LogEntry[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-map'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      
      const map = new Map<string, { name: string; email: string; initials: string }>();
      data?.forEach(p => {
        const name = p.full_name || 'Sem nome';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        map.set(p.user_id, { 
          name, 
          email: p.email || '',
          initials
        });
      });
      return map;
    },
  });

  const uniqueActions = [...new Set(logs?.map(log => log.action) || [])];
  const uniqueEntityTypes = [...new Set(logs?.map(log => log.entity_type) || [])];

  const getDateFilterDate = (filter: string): Date | null => {
    const now = new Date();
    switch (filter) {
      case "today": return startOfDay(now);
      case "week": return subDays(now, 7);
      case "month": return subDays(now, 30);
      default: return null;
    }
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    
    const filterDate = getDateFilterDate(dateFilter);
    const matchesDate = !filterDate || (log.created_at && isAfter(new Date(log.created_at), filterDate));
    
    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  const getUserInfo = (userId: string | null) => {
    if (!userId) return { name: 'Sistema', initials: 'SIS', email: '' };
    const profile = profiles?.get(userId);
    return profile || { name: 'Usuário desconhecido', initials: '??', email: '' };
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const renderFormattedDetails = (log: LogEntry) => {
    const formatted = formatLogDetails(log.action, log.details, log.entity_type);
    // Parse markdown-like bold syntax
    const parts = formatted.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6" />
            Logs de Atividade
          </h1>
          <p className="text-muted-foreground">
            Histórico detalhado de todas as ações no sistema
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação, tipo, ou detalhes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                </div>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {getActionConfig(action).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas entidades</SelectItem>
                    {uniqueEntityTypes.map(entity => (
                      <SelectItem key={entity} value={entity}>
                        {getEntityTypeLabel(entity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(dateFilter !== "all" || actionFilter !== "all" || entityFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setDateFilter("all");
                      setActionFilter("all");
                      setEntityFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* Results count */}
              {filteredLogs && (
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[140px]">Quando</TableHead>
                      <TableHead className="w-[180px]">Executado por</TableHead>
                      <TableHead className="w-[180px]">Ação</TableHead>
                      <TableHead className="w-[120px]">Entidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const userInfo = getUserInfo(log.user_id);
                      return (
                        <TableRow key={log.id} className="group hover:bg-muted/30">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {getRelativeTime(log.created_at || "")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {log.created_at && format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {userInfo.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium truncate max-w-[120px]">
                                  {userInfo.name}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <LogActionBadge action={log.action} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {getEntityTypeLabel(log.entity_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="text-sm text-muted-foreground truncate">
                              {renderFormattedDetails(log)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ScrollText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum log encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </CardContent>
        </Card>

        <LogDetailsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          log={selectedLog}
          userName={getUserInfo(selectedLog?.user_id || null).name}
        />
      </div>
    </AppLayout>
  );
}
