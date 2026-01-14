import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, Phone, Calendar, Clock, MessageSquare, 
  MapPin, FileText, Briefcase, DollarSign, Tag
} from 'lucide-react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface Project {
  id: string;
  status: string;
  budget: number | null;
  package_total_value: number | null;
}

interface Payment {
  amount: number;
  status: string;
}

interface ClientOverviewTabProps {
  client: Client;
  projects: Project[];
  payments: Payment[];
}

const contactMethodLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  email: 'E-mail',
  instagram_dm: 'Instagram Direct',
  discord: 'Discord',
  presencial: 'Presencial',
  outro: 'Outro',
};

const contactTimeLabels: Record<string, string> = {
  manha: 'Manhã (8h-12h)',
  tarde: 'Tarde (12h-18h)',
  noite: 'Noite (18h-21h)',
  qualquer: 'Qualquer horário',
};

const originLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
  discord: 'Discord',
  indicacao_cliente: 'Indicação de Cliente',
  indicacao_parceiro: 'Indicação de Parceiro',
  linkedin: 'LinkedIn',
  site: 'Site/Landing Page',
  evento: 'Evento',
  outro: 'Outro',
};

export function ClientOverviewTab({ client, projects, payments }: ClientOverviewTabProps) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  
  const totalInvoiced = projects.reduce((acc, p) => acc + (p.package_total_value || p.budget || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);

  const getFollowupStatus = (date: string | null) => {
    if (!date) return null;
    const followupDate = parseISO(date);
    if (isToday(followupDate)) return { status: 'today', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Hoje' };
    if (isPast(followupDate)) return { status: 'overdue', color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Atrasado' };
    return { status: 'upcoming', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Agendado' };
  };

  const followupStatus = getFollowupStatus(client.next_followup_date);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Info Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact Info */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="glass rounded-lg p-2">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp Principal</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            {client.secondary_phone && (
              <div className="flex items-center gap-3">
                <div className="glass rounded-lg p-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone Secundário</p>
                  <p className="font-medium">{client.secondary_phone}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="glass rounded-lg p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium truncate">{client.email}</p>
                </div>
              </div>
            )}
            {client.primary_contact_method && (
              <div className="flex items-center gap-3">
                <div className="glass rounded-lg p-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contato Preferido</p>
                  <p className="font-medium">{contactMethodLabels[client.primary_contact_method] || client.primary_contact_method}</p>
                </div>
              </div>
            )}
            {client.preferred_contact_time && (
              <div className="flex items-center gap-3">
                <div className="glass rounded-lg p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horário Preferido</p>
                  <p className="font-medium">{contactTimeLabels[client.preferred_contact_time] || client.preferred_contact_time}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="glass rounded-lg p-2">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests & Notes */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Interesses e Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.main_interest && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Interesse Principal</p>
                <p className="font-medium">{client.main_interest}</p>
              </div>
            )}
            {client.product_service_interest && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Produto/Serviço de Interesse</p>
                <p className="font-medium">{client.product_service_interest}</p>
              </div>
            )}
            {client.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações Gerais</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            {!client.main_interest && !client.product_service_interest && !client.notes && (
              <p className="text-muted-foreground text-sm">Nenhuma observação registrada.</p>
            )}
          </CardContent>
        </Card>

        {/* Document */}
        {client.document && (
          <Card className="glass-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono">{client.document}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs">Total de Projetos</span>
              </div>
              <p className="text-2xl font-bold">{totalProjects}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>{activeProjects} ativos</span>
                <span>{completedProjects} concluídos</span>
              </div>
            </div>

            <div className="glass rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Faturado</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                R$ {totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="glass rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Recebido</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Follow-up */}
        {client.next_followup_date && (
          <Card className="glass-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximo Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {format(parseISO(client.next_followup_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </p>
                {followupStatus && (
                  <Badge variant="outline" className={followupStatus.color}>
                    {followupStatus.label}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Origin & Dates */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Origem e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.origin && (
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="font-medium">{originLabels[client.origin] || client.origin}</p>
              </div>
            )}
            {client.campaign_source && (
              <div>
                <p className="text-xs text-muted-foreground">Campanha</p>
                <p className="font-medium">{client.campaign_source}</p>
              </div>
            )}
            {client.first_contact_date && (
              <div>
                <p className="text-xs text-muted-foreground">Primeiro Contato</p>
                <p className="font-medium">
                  {format(parseISO(client.first_contact_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Cliente desde</p>
              <p className="font-medium">
                {format(new Date(client.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
