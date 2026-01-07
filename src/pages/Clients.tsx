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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Users, Building2, Mail, Phone, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
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
    setCompany('');
    setEmail('');
    setPhone('');
    setDocument('');
    setAddress('');
    setNotes('');
    setStatus('active');
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setDocument(client.document || '');
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setStatus(client.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const clientData = {
      user_id: user.id,
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      document: document || null,
      address: address || null,
      notes: notes || null,
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
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    potential: 'bg-warning/10 text-warning border-warning/20',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    potential: 'Potencial',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="potential">Potencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
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
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
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
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
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
            {filteredClients.map((client) => (
              <Card key={client.id} className="border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {client.company}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                  <Badge variant="outline" className={statusColors[client.status]}>
                    {statusLabels[client.status]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
