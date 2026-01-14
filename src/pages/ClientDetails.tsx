import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, User, Briefcase, DollarSign, History, 
  Building2, MapPin, Pencil
} from 'lucide-react';

import { ClientOverviewTab } from '@/components/clients/ClientOverviewTab';
import { ClientProjectsTab } from '@/components/clients/ClientProjectsTab';
import { ClientFinancesTab } from '@/components/clients/ClientFinancesTab';
import { ClientTimelineTab } from '@/components/clients/ClientTimelineTab';

interface Client {
  id: string;
  name: string;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  client_type: string | null;
  origin: string | null;
  primary_contact_method: string | null;
  preferred_contact_time: string | null;
  campaign_source: string | null;
  first_contact_date: string | null;
  main_interest: string | null;
  product_service_interest: string | null;
  next_followup_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  budget: number | null;
  package_total_value: number | null;
  project_type: string;
  deadline: string | null;
  created_at: string;
  project_arts?: { id: string; status: string }[];
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  projects: { name: string } | null;
}

interface Interaction {
  id: string;
  interaction_type: string;
  title: string;
  description: string | null;
  interaction_date: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-muted/50 text-muted-foreground border-border/50',
  potential: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  potential: 'Potencial',
};

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id && user) {
      fetchClientData();
    }
  }, [id, user]);

  const fetchClientData = async () => {
    if (!id) return;
    setIsLoading(true);

    try {
      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        toast({ variant: 'destructive', title: 'Cliente não encontrado' });
        navigate('/clients');
        return;
      }
      setClient(clientData);

      // Fetch projects with arts
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, priority, budget, package_total_value, project_type, deadline, created_at, project_arts(id, status)')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch payments from client's projects
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount, status, payment_date, notes, created_at, projects(name)')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      }

      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('client_interactions')
        .select('*')
        .eq('client_id', id)
        .order('interaction_date', { ascending: false });

      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInteraction = async (data: { 
    interaction_type: string; 
    title: string; 
    description: string; 
    interaction_date: string 
  }) => {
    if (!user || !id) return;

    const { error } = await supabase
      .from('client_interactions')
      .insert([{
        user_id: user.id,
        client_id: id,
        ...data,
      }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar interação', description: error.message });
    } else {
      toast({ title: 'Interação adicionada!' });
      fetchClientData();
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    const { error } = await supabase
      .from('client_interactions')
      .delete()
      .eq('id', interactionId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir interação', description: error.message });
    } else {
      toast({ title: 'Interação excluída!' });
      fetchClientData();
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="link" onClick={() => navigate('/clients')}>
            Voltar para clientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const clientTypeLabel = client.client_type === 'pessoa_juridica' ? 'PJ' : 'PF';

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clients')}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold lg:text-3xl text-gradient">
                  {client.name} {client.last_name || ''}
                </h1>
                <Badge variant="outline" className={statusColors[client.status]}>
                  {statusLabels[client.status]}
                </Badge>
                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-white/10">
                  {clientTypeLabel}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {client.company && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {client.company}
                  </span>
                )}
                {client.origin && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {client.origin}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="glass border-white/10 gap-2"
            onClick={() => navigate(`/clients?edit=${client.id}`)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/30 border border-white/5 w-fit">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Projetos</span>
              {projects.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {projects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="finances" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
              {interactions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {interactions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ClientOverviewTab client={client} projects={projects} payments={payments} />
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <ClientProjectsTab projects={projects} clientId={client.id} />
          </TabsContent>

          <TabsContent value="finances" className="mt-0">
            <ClientFinancesTab projects={projects} payments={payments} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <ClientTimelineTab 
              interactions={interactions} 
              onAddInteraction={handleAddInteraction}
              onDeleteInteraction={handleDeleteInteraction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
