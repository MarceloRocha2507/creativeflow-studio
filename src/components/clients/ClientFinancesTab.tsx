import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock, CheckCircle2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  budget: number | null;
  package_total_value: number | null;
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

interface ClientFinancesTabProps {
  projects: Project[];
  payments: Payment[];
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/30',
  cancelled: 'bg-muted/50 text-muted-foreground border-border/50',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

export function ClientFinancesTab({ projects, payments }: ClientFinancesTabProps) {
  // Calculate totals
  const totalInvoiced = projects.reduce((acc, p) => acc + (p.package_total_value || p.budget || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0);
  const pendingBalance = totalInvoiced - totalReceived;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="glass rounded-lg p-2.5 bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Faturado</p>
                <p className="text-xl font-bold">
                  R$ {totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="glass rounded-lg p-2.5 bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Recebido</p>
                <p className="text-xl font-bold text-emerald-400">
                  R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="glass rounded-lg p-2.5 bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-xl font-bold text-yellow-400">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="glass rounded-lg p-2.5 bg-cyan-500/10">
                <DollarSign className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo a Receber</p>
                <p className="text-xl font-bold text-cyan-400">
                  R$ {pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Projeto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id} className="border-white/5">
                      <TableCell className="font-medium">
                        {payment.projects?.name || 'Projeto removido'}
                      </TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={paymentStatusColors[payment.status]}>
                          {paymentStatusLabels[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.payment_date 
                          ? format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {payment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Value Breakdown */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Valor por Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum projeto registrado.</p>
          ) : (
            <div className="space-y-3">
              {projects.map(project => {
                const value = project.package_total_value || project.budget || 0;
                return (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="font-medium">{project.name}</span>
                    <span className="text-emerald-400 font-medium">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
