import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Search, Users, Building2, Mail, Phone, MoreVertical, Pencil, Trash2,
  MapPin, Clock, User, Briefcase
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
  { value: 'discord', label: 'Discord' },
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

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('dados');
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
    setActiveTab('dados');
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
    setActiveTab('dados');
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
      setActiveTab('dados');
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
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    potential: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  const statusDotColors: Record<string, string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-muted-foreground',
    potential: 'bg-amber-500',
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
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus clientes e contatos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                <DialogDescription className="sr-only">Formulário de cadastro de cliente</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dados" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Dados</span>
                    </TabsTrigger>
                    <TabsTrigger value="contato" className="gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">Contato</span>
                    </TabsTrigger>
                    <TabsTrigger value="comercial" className="gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="hidden sm:inline">Comercial</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Dados Básicos */}
                  <TabsContent value="dados" className="space-y-4 mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Nome do cliente"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input 
                          id="lastName" 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)} 
                          placeholder="Sobrenome"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="clientType">Tipo</Label>
                        <Select value={clientType} onValueChange={setClientType}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CLIENT_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {clientType === 'pessoa_juridica' && (
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input 
                          id="company" 
                          value={company} 
                          onChange={(e) => setCompany(e.target.value)} 
                          placeholder="Nome da empresa"
                          className="h-11"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="document">{clientType === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}</Label>
                      <Input 
                        id="document" 
                        value={document} 
                        onChange={(e) => setDocument(e.target.value)} 
                        placeholder={clientType === 'pessoa_juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações *</Label>
                      <Textarea 
                        id="notes" 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        rows={3} 
                        placeholder="Informações importantes sobre o cliente..."
                      />
                    </div>
                  </TabsContent>

                  {/* Tab 2: Contato */}
                  <TabsContent value="contato" className="space-y-4 mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp</Label>
                        <Input 
                          id="phone" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          placeholder="(00) 00000-0000"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryPhone">Telefone Secundário</Label>
                        <Input 
                          id="secondaryPhone" 
                          value={secondaryPhone} 
                          onChange={(e) => setSecondaryPhone(e.target.value)} 
                          placeholder="(00) 0000-0000"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="email@exemplo.com"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="primaryContactMethod">Meio Principal *</Label>
                        <Select value={primaryContactMethod} onValueChange={setPrimaryContactMethod}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTACT_METHOD_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredContactTime">Melhor Horário</Label>
                        <Select value={preferredContactTime} onValueChange={setPreferredContactTime}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTACT_TIME_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input 
                        id="address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Endereço completo"
                        className="h-11"
                      />
                    </div>
                  </TabsContent>

                  {/* Tab 3: Comercial */}
                  <TabsContent value="comercial" className="space-y-4 mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="origin">Origem *</Label>
                        <Select value={origin} onValueChange={setOrigin}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="De onde veio?" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORIGIN_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campaignSource">Campanha/Fonte</Label>
                        <Input 
                          id="campaignSource" 
                          value={campaignSource} 
                          onChange={(e) => setCampaignSource(e.target.value)} 
                          placeholder="Nome da campanha"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstContactDate">Primeiro Contato</Label>
                        <Input 
                          id="firstContactDate" 
                          type="date" 
                          value={firstContactDate} 
                          onChange={(e) => setFirstContactDate(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextFollowupDate">Próximo Follow-up</Label>
                        <Input 
                          id="nextFollowupDate" 
                          type="date" 
                          value={nextFollowupDate} 
                          onChange={(e) => setNextFollowupDate(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mainInterest">Interesse Principal</Label>
                      <Input 
                        id="mainInterest" 
                        value={mainInterest} 
                        onChange={(e) => setMainInterest(e.target.value)} 
                        placeholder="O que mais interessa ao cliente"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productServiceInterest">Produto/Serviço de Interesse</Label>
                      <Input 
                        id="productServiceInterest" 
                        value={productServiceInterest} 
                        onChange={(e) => setProductServiceInterest(e.target.value)} 
                        placeholder="Produtos ou serviços específicos"
                        className="h-11"
                      />
                    </div>

                    {editingClient && (
                      <div className="pt-2 text-sm text-muted-foreground">
                        Última atualização: {format(new Date(editingClient.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setIsDialogOpen(false); resetForm(); }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingClient ? 'Salvar' : 'Criar Cliente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="potential">Potenciais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione seu primeiro cliente para começar'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => {
              const followupStatus = getFollowupStatus(client.next_followup_date);
              return (
                <Card 
                  key={client.id} 
                  className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDotColors[client.status]}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {client.name} {client.last_name}
                            </span>
                            {client.client_type && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {clientTypeLabels[client.client_type]}
                              </Badge>
                            )}
                          </div>
                          {client.company && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{client.company}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                    </div>

                    <div className="mt-4 space-y-2">
                      {client.origin && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{originLabels[client.origin] || client.origin}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.next_followup_date && (
                        <div className={`flex items-center gap-2 text-sm ${
                          followupStatus === 'overdue' ? 'text-red-500' : 
                          followupStatus === 'today' ? 'text-amber-500' : 
                          'text-muted-foreground'
                        }`}>
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {format(parseISO(client.next_followup_date), 'dd/MM')}
                            {followupStatus === 'overdue' && ' · Atrasado'}
                            {followupStatus === 'today' && ' · Hoje'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <Badge variant="outline" className={statusColors[client.status]}>
                        {statusLabels[client.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(client.created_at), 'dd/MM/yy')}
                      </span>
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
