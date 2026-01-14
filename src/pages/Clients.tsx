import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Search, Users, Building2, Mail, Phone, MoreVertical, Pencil, Trash2,
  MapPin, Target, Calendar, Clock, MessageSquare, User, Briefcase, Tag
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  updated_at: string;
}

const ORIGIN_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'indicacao_cliente', label: 'Indicação de Cliente' },
  { value: 'indicacao_parceiro', label: 'Indicação de Parceiro' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'site', label: 'Site/Landing Page' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
];

const CONTACT_METHOD_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'instagram_dm', label: 'Instagram Direct' },
  { value: 'discord', label: 'Discord' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'outro', label: 'Outro' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'pessoa_juridica', label: 'Pessoa Jurídica' },
];

const CONTACT_TIME_OPTIONS = [
  { value: 'manha', label: 'Manhã (8h-12h)' },
  { value: 'tarde', label: 'Tarde (12h-18h)' },
  { value: 'noite', label: 'Noite (18h-21h)' },
  { value: 'qualquer', label: 'Qualquer horário' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'potential', label: 'Potencial' },
];

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const FormSection = ({ icon, title, children }: FormSectionProps) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-sm font-medium text-primary">
      {icon}
      <span>{title}</span>
    </div>
    <Separator className="bg-white/10" />
    <div className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  </div>
);

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state - Required fields
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [primaryContactMethod, setPrimaryContactMethod] = useState('');
  const [notes, setNotes] = useState('');
  
  // Form state - Optional fields
  const [lastName, setLastName] = useState('');
  const [clientType, setClientType] = useState('pessoa_fisica');
  const [company, setCompany] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState('');
  const [address, setAddress] = useState('');
  const [campaignSource, setCampaignSource] = useState('');
  const [firstContactDate, setFirstContactDate] = useState('');
  const [mainInterest, setMainInterest] = useState('');
  const [productServiceInterest, setProductServiceInterest] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar clientes', description: error.message });
    } else {
      setClients(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setName('');
    setLastName('');
    setOrigin('');
    setPrimaryContactMethod('');
    setNotes('');
    setClientType('pessoa_fisica');
    setCompany('');
    setDocument('');
    setPhone('');
    setSecondaryPhone('');
    setEmail('');
    setPreferredContactTime('');
    setAddress('');
    setCampaignSource('');
    setFirstContactDate('');
    setMainInterest('');
    setProductServiceInterest('');
    setNextFollowupDate('');
    setStatus('active');
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setLastName(client.last_name || '');
    setOrigin(client.origin || '');
    setPrimaryContactMethod(client.primary_contact_method || '');
    setNotes(client.notes || '');
    setClientType(client.client_type || 'pessoa_fisica');
    setCompany(client.company || '');
    setDocument(client.document || '');
    setPhone(client.phone || '');
    setSecondaryPhone(client.secondary_phone || '');
    setEmail(client.email || '');
    setPreferredContactTime(client.preferred_contact_time || '');
    setAddress(client.address || '');
    setCampaignSource(client.campaign_source || '');
    setFirstContactDate(client.first_contact_date || '');
    setMainInterest(client.main_interest || '');
    setProductServiceInterest(client.product_service_interest || '');
    setNextFollowupDate(client.next_followup_date || '');
    setStatus(client.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!name.trim() || !origin || !primaryContactMethod || !notes.trim()) {
      toast({ 
        variant: 'destructive', 
        title: 'Campos obrigatórios', 
        description: 'Preencha todos os campos obrigatórios (Origem, Nome, Meio de Contato e Observações)' 
      });
      return;
    }

    const clientData = {
      user_id: user.id,
      name: name.trim(),
      last_name: lastName.trim() || null,
      origin,
      primary_contact_method: primaryContactMethod,
      notes: notes.trim(),
      client_type: clientType,
      company: company.trim() || null,
      document: document.trim() || null,
      phone: phone.trim() || null,
      secondary_phone: secondaryPhone.trim() || null,
      email: email.trim() || null,
      preferred_contact_time: preferredContactTime || null,
      address: address.trim() || null,
      campaign_source: campaignSource.trim() || null,
      first_contact_date: firstContactDate || null,
      main_interest: mainInterest.trim() || null,
      product_service_interest: productServiceInterest.trim() || null,
      next_followup_date: nextFollowupDate || null,
      status,
    };

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingClient.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar cliente', description: error.message });
      } else {
        toast({ title: 'Cliente atualizado com sucesso!' });
        fetchClients();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert([clientData]);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar cliente', description: error.message });
      } else {
        toast({ title: 'Cliente criado com sucesso!' });
        fetchClients();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir cliente', description: error.message });
    } else {
      toast({ title: 'Cliente excluído com sucesso!' });
      fetchClients();
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.main_interest?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const clientTypeLabels: Record<string, string> = {
    pessoa_fisica: 'PF',
    pessoa_juridica: 'PJ',
  };

  const originLabels = ORIGIN_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  }, {} as Record<string, string>);

  const getFollowupStatus = (date: string | null) => {
    if (!date) return null;
    const followupDate = parseISO(date);
    if (isToday(followupDate)) return 'today';
    if (isPast(followupDate)) return 'overdue';
    return 'upcoming';
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 glow-primary">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-gradient">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Origem e Contato Principal */}
                <FormSection icon={<MapPin className="h-4 w-4" />} title="ORIGEM E CONTATO PRINCIPAL">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origem do Cliente *</Label>
                    <Select value={origin} onValueChange={setOrigin}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {ORIGIN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactMethod">Meio de Contato Principal *</Label>
                    <Select value={primaryContactMethod} onValueChange={setPrimaryContactMethod}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue placeholder="Selecione o meio" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {CONTACT_METHOD_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="glass border-white/10" placeholder="Nome do cliente" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="glass border-white/10" placeholder="Sobrenome" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes">Observações Gerais *</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="glass border-white/10" placeholder="Informações importantes sobre o cliente..." />
                  </div>
                </FormSection>

                {/* Section 2: Informações Básicas */}
                <FormSection icon={<User className="h-4 w-4" />} title="INFORMAÇÕES BÁSICAS">
                  <div className="space-y-2">
                    <Label htmlFor="clientType">Tipo de Cliente</Label>
                    <Select value={clientType} onValueChange={setClientType}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {CLIENT_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {clientType === 'pessoa_juridica' && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="company">Nome da Empresa</Label>
                      <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="glass border-white/10" placeholder="Nome da empresa" />
                    </div>
                  )}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="document">{clientType === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}</Label>
                    <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} className="glass border-white/10" placeholder={clientType === 'pessoa_juridica' ? '00.000.000/0000-00' : '000.000.000-00'} />
                  </div>
                </FormSection>

                {/* Section 3: Contato */}
                <FormSection icon={<Phone className="h-4 w-4" />} title="CONTATO">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone Principal</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="glass border-white/10" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryPhone">Telefone Secundário</Label>
                    <Input id="secondaryPhone" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} className="glass border-white/10" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass border-white/10" placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredContactTime">Melhor Horário</Label>
                    <Select value={preferredContactTime} onValueChange={setPreferredContactTime}>
                      <SelectTrigger className="glass border-white/10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {CONTACT_TIME_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="glass border-white/10" placeholder="Endereço completo" />
                  </div>
                </FormSection>

                {/* Section 4: Origem e Marketing */}
                <FormSection icon={<Tag className="h-4 w-4" />} title="ORIGEM E MARKETING">
                  <div className="space-y-2">
                    <Label htmlFor="campaignSource">Campanha/Indicação</Label>
                    <Input id="campaignSource" value={campaignSource} onChange={(e) => setCampaignSource(e.target.value)} className="glass border-white/10" placeholder="Ex: Black Friday 2024, João Silva..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstContactDate">Data do Primeiro Contato</Label>
                    <Input id="firstContactDate" type="date" value={firstContactDate} onChange={(e) => setFirstContactDate(e.target.value)} className="glass border-white/10" />
                  </div>
                </FormSection>

                {/* Section 5: Atendimento e Vendas */}
                <FormSection icon={<Target className="h-4 w-4" />} title="ATENDIMENTO E VENDAS">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="mainInterest">Interesse/Necessidade Principal</Label>
                    <Textarea id="mainInterest" value={mainInterest} onChange={(e) => setMainInterest(e.target.value)} rows={2} className="glass border-white/10" placeholder="O que o cliente busca ou precisa..." />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="productServiceInterest">Produto/Serviço de Interesse</Label>
                    <Input id="productServiceInterest" value={productServiceInterest} onChange={(e) => setProductServiceInterest(e.target.value)} className="glass border-white/10" placeholder="Produtos ou serviços específicos" />
                  </div>
                </FormSection>

                {/* Section 6: Controle */}
                <FormSection icon={<Calendar className="h-4 w-4" />} title="CONTROLE">
                  <div className="space-y-2">
                    <Label htmlFor="nextFollowupDate">Próximo Follow-up</Label>
                    <Input id="nextFollowupDate" type="date" value={nextFollowupDate} onChange={(e) => setNextFollowupDate(e.target.value)} className="glass border-white/10" />
                  </div>
                  {editingClient && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Última Atualização</Label>
                      <p className="text-sm text-muted-foreground py-2">
                        {format(new Date(editingClient.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </FormSection>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="glass border-white/10">
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary glow-primary">
                    {editingClient ? 'Salvar' : 'Criar Cliente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 glass border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="potential">Potenciais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="glass-card border-white/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full glass p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione seu primeiro cliente para começar'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client, index) => {
              const followupStatus = getFollowupStatus(client.next_followup_date);
              return (
                <Card 
                  key={client.id} 
                  className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">
                          {client.name} {client.last_name && client.last_name}
                        </CardTitle>
                        {client.client_type && (
                          <Badge variant="outline" className="shrink-0 text-xs bg-primary/10 text-primary border-primary/30">
                            {clientTypeLabels[client.client_type] || client.client_type}
                          </Badge>
                        )}
                      </div>
                      {client.company && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span className="truncate">{client.company}</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-white/10">
                        <DropdownMenuItem onClick={() => openEditDialog(client)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {client.origin && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
                        <span>{originLabels[client.origin] || client.origin}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary/70 shrink-0" />
                        {client.phone}
                      </div>
                    )}
                    {client.next_followup_date && (
                      <div className={`flex items-center gap-2 text-sm ${
                        followupStatus === 'overdue' ? 'text-red-400' : 
                        followupStatus === 'today' ? 'text-amber-400' : 
                        'text-muted-foreground'
                      }`}>
                        <Clock className={`h-4 w-4 shrink-0 ${
                          followupStatus === 'overdue' ? 'text-red-400' : 
                          followupStatus === 'today' ? 'text-amber-400' : 
                          'text-primary/70'
                        }`} />
                        <span>
                          Follow-up: {format(parseISO(client.next_followup_date), 'dd/MM/yyyy')}
                          {followupStatus === 'overdue' && ' (Atrasado)'}
                          {followupStatus === 'today' && ' (Hoje)'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className={statusColors[client.status]}>
                        {statusLabels[client.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
