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
import { Loader2, Send, Package, CheckCircle, XCircle } from "lucide-react";

const ShopStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeOrders, setActiveOrders] = useState(0);
  const [acceptingOrders, setAcceptingOrders] = useState(true);

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

  // Update local state when data loads
  useEffect(() => {
    if (status) {
      setActiveOrders(status.active_orders);
      setAcceptingOrders(status.accepting_orders);
    }
  }, [status]);

  // Mutation to update status and send to Discord
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("update-discord-status", {
        body: {
          active_orders: activeOrders,
          accepting_orders: acceptingOrders,
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
            Configure o status de encomendas que será exibido no Discord
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Configurar Status
              </CardTitle>
              <CardDescription>
                Defina o número de encomendas ativas e se está aceitando novas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="active-orders">Encomendas Ativas</Label>
                <Input
                  id="active-orders"
                  type="number"
                  min="0"
                  max="999"
                  value={activeOrders}
                  onChange={(e) => setActiveOrders(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-2xl font-bold h-14"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="accepting-orders" className="text-base">
                    Aceitando Novas Encomendas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {acceptingOrders 
                      ? "Você está recebendo novos pedidos" 
                      : "Novos pedidos estão desativados"}
                  </p>
                </div>
                <Switch
                  id="accepting-orders"
                  checked={acceptingOrders}
                  onCheckedChange={setAcceptingOrders}
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
                <div className="font-semibold text-white mb-3">
                  📦 STATUS DA LOJA
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[#b9bbbe] text-xs uppercase mb-1">
                      📊 Encomendas Ativas
                    </div>
                    <div className="text-white font-bold text-lg">
                      {activeOrders}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[#b9bbbe] text-xs uppercase mb-1">
                      {acceptingOrders ? "✅" : "❌"} Aceitando Novas
                    </div>
                    <div className={`font-bold text-lg flex items-center gap-1 ${
                      acceptingOrders ? "text-green-400" : "text-red-400"
                    }`}>
                      {acceptingOrders ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          SIM
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          NÃO
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[#72767d] text-xs mt-4 pt-3 border-t border-[#40444b]">
                  🕐 Atualizado: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
