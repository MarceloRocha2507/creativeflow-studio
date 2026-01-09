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
import { Plus, DollarSign, TrendingUp, Clock, MoreVertical, Pencil, Trash2, Receipt, Wallet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  budget: number | null;
}

interface Payment {
  id: string;
  project_id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  projects?: { name: string } | null;
}

export default function Finances() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('pending');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [paymentsRes, projectsRes] = await Promise.all([
      supabase.from('payments').select('*, projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, budget'),
    ]);

    if (paymentsRes.error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar pagamentos', description: paymentsRes.error.message });
    } else {
      setPayments(paymentsRes.data || []);
    }

    if (!projectsRes.error) {
      setProjects(projectsRes.data || []);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setProjectId('');
    setAmount('');
    setStatus('pending');
    setPaymentDate('');
    setNotes('');
    setEditingPayment(null);
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setProjectId(payment.project_id);
    setAmount(payment.amount.toString());
    setStatus(payment.status);
    setPaymentDate(payment.payment_date || '');
    setNotes(payment.notes || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId) return;

    const paymentData = {
      user_id: user.id,
      project_id: projectId,
      amount: parseFloat(amount),
      status,
      payment_date: paymentDate || null,
      notes: notes || null,
    };

    if (editingPayment) {
      const { error } = await supabase.from('payments').update(paymentData).eq('id', editingPayment.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
      } else {
        toast({ title: 'Pagamento atualizado!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('payments').insert([paymentData]);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar', description: error.message });
      } else {
        toast({ title: 'Pagamento registrado!' });
        fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Pagamento excluído!' });
      fetchData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate totals
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const monthlyPayments = payments.filter(p => {
    if (!p.payment_date) return false;
    const date = new Date(p.payment_date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalReceived = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const monthlyReceived = monthlyPayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalProjectValue = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    partial: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    partial: 'Parcial',
    paid: 'Pago',
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Financeiro</h1>
            <p className="text-muted-foreground">Controle de pagamentos e faturamento</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 glow-primary">
                <Plus className="h-4 w-4" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle className="text-gradient">{editingPayment ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Projeto *</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                    <SelectContent className="glass-card border-white/10">
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="glass border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="glass border-white/10" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="glass border-white/10">Cancelar</Button>
                  <Button type="submit" className="gradient-primary glow-primary">{editingPayment ? 'Salvar' : 'Registrar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceived)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <Wallet className="h-4 w-4 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{formatCurrency(monthlyReceived)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card glass-border group transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor em Projetos</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalProjectValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card className="glass-card glass-border">
          <CardHeader>
            <CardTitle className="text-gradient">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full glass p-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhum pagamento registrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">Registre seu primeiro pagamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between rounded-xl glass glass-border p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{payment.projects?.name}</span>
                        <Badge variant="outline" className={statusColors[payment.status]}>
                          {statusLabels[payment.status]}
                        </Badge>
                      </div>
                      {payment.payment_date && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold ${payment.status === 'paid' ? 'text-emerald-400' : 'text-foreground'}`}>
                        {formatCurrency(payment.amount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-white/10">
                          <DropdownMenuItem onClick={() => openEditDialog(payment)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(payment.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
