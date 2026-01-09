import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Package, CheckCircle, XCircle, Clock, MessageSquare, Image } from "lucide-react";

const ShopStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [estimatedStartTime, setEstimatedStartTime] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Fetch current status
  const { data: status, isLoading } = useQuery({
    queryKey: ["shop-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_status")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch project stats
  const { data: projectStats } = useQuery({
    queryKey: ["project-stats"],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [inProgress, pending, completed] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", firstDayOfMonth.toISOString()),
      ]);

      return {
        in_progress: inProgress.count || 0,
        pending: pending.count || 0,
        completed_this_month: completed.count || 0,
      };
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (status) {
      setAcceptingOrders(status.accepting_orders);
      setEstimatedStartTime(status.estimated_start_time || "");
      setCustomMessage(status.custom_message || "");
      setLogoUrl(status.logo_url || "");
    }
  }, [status]);

  // Mutation to update status and send to Discord
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("update-discord-status", {
        body: {
          accepting_orders: acceptingOrders,
          estimated_start_time: estimatedStartTime,
          custom_message: customMessage,
          logo_url: logoUrl,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-status"] });
      toast({
        title: "Status atualizado!",
        description: "O status foi atualizado e enviado para o Discord.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Status da Loja</h1>
          <p className="text-muted-foreground">
            Configure o status de disponibilidade que será exibido no Discord
          </p>
        </div>

        {/* Stats Cards */}
        {projectStats && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                    <p className="text-3xl font-bold">{projectStats.in_progress}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Concluídos (mês)</p>
                    <p className="text-3xl font-bold">{projectStats.completed_this_month}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Na Fila</p>
                    <p className="text-3xl font-bold">{projectStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Configurar Status
              </CardTitle>
              <CardDescription>
                Defina as opções de disponibilidade e personalização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accepting Orders Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="accepting-orders" className="text-base">
                    Aceitando Novos Projetos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {acceptingOrders 
                      ? "Você está recebendo novos projetos" 
                      : "Novos projetos estão desativados"}
                  </p>
                </div>
                <Switch
                  id="accepting-orders"
                  checked={acceptingOrders}
                  onCheckedChange={setAcceptingOrders}
                />
              </div>

              {/* Estimated Start Time */}
              <div className="space-y-2">
                <Label htmlFor="estimated-start" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Previsão de Início
                </Label>
                <Input
                  id="estimated-start"
                  placeholder="Ex: 3-5 dias úteis"
                  value={estimatedStartTime}
                  onChange={(e) => setEstimatedStartTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo estimado para iniciar novos projetos
                </p>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo-url" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL da Logo/Thumbnail
                </Label>
                <Input
                  id="logo-url"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Imagem que aparecerá no canto do embed (recomendado: 80x80px)
                </p>
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="custom-message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagem Personalizada
                </Label>
                <Textarea
                  id="custom-message"
                  placeholder="Observações adicionais para exibir no Discord..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Atualizar e Enviar para Discord
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="bg-[#36393f] text-white border-none">
            <CardHeader>
              <CardTitle className="text-[#dcddde] text-sm font-normal">
                Preview do Discord
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`rounded-l border-l-4 p-4 ${
                  acceptingOrders 
                    ? "border-l-green-500 bg-[#2f3136]" 
                    : "border-l-red-500 bg-[#2f3136]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-2">
                      📊 Painel de Disponibilidade
                    </div>
                    <div className="text-[#b9bbbe] text-sm mb-4 italic">
                      &gt; Acompanhe em tempo real nossa capacidade de atendimento
                    </div>
                  </div>
                  {logoUrl && (
                    <div className="ml-4 flex-shrink-0">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-20 h-20 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div className="bg-[#202225] rounded p-2 text-center">
                    <div className="text-[#b9bbbe] text-xs mb-1">📦 Em Andamento</div>
                    <div className="text-white font-mono font-bold">
                      {projectStats?.in_progress || 0}
                    </div>
                  </div>
                  <div className="bg-[#202225] rounded p-2 text-center">
                    <div className="text-[#b9bbbe] text-xs mb-1">✅ Concluídos</div>
                    <div className="text-white font-mono font-bold">
                      {projectStats?.completed_this_month || 0}
                    </div>
                  </div>
                  <div className="bg-[#202225] rounded p-2 text-center">
                    <div className="text-[#b9bbbe] text-xs mb-1">⏳ Na Fila</div>
                    <div className="text-white font-mono font-bold">
                      {projectStats?.pending || 0}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[#b9bbbe] text-xs uppercase mb-1">
                    {acceptingOrders ? "✅" : "🔴"} Disponibilidade
                  </div>
                  <div className={`font-semibold ${acceptingOrders ? "text-green-400" : "text-red-400"}`}>
                    {acceptingOrders ? (
                      <>
                        <span className="font-bold">ACEITANDO NOVOS PROJETOS</span>
                        <div className="text-sm font-normal text-[#b9bbbe]">Estamos disponíveis para novos trabalhos!</div>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">TEMPORARIAMENTE FECHADO</span>
                        <div className="text-sm font-normal text-[#b9bbbe]">No momento não estamos aceitando novos projetos.</div>
                      </>
                    )}
                  </div>
                </div>

                {estimatedStartTime && (
                  <div className="mb-4">
                    <div className="text-[#b9bbbe] text-xs uppercase mb-1">⏱️ Previsão de Início</div>
                    <div className="text-white">Novos projetos: <strong>{estimatedStartTime}</strong></div>
                  </div>
                )}

                {customMessage && (
                  <div className="mb-4">
                    <div className="text-[#b9bbbe] text-xs uppercase mb-1">💬 Observações</div>
                    <div className="text-white">{customMessage}</div>
                  </div>
                )}

                <div className="text-[#72767d] text-xs mt-4 pt-3 border-t border-[#40444b]">
                  🕐 Atualizado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Update Info */}
        {status?.updated_at && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: {new Date(status.updated_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(status.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ShopStatus;