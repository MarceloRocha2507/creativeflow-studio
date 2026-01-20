import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentMethodSelect, PaymentMethod, paymentMethods } from './PaymentMethodSelect';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Calculator, CalendarClock } from 'lucide-react';

interface Payment {
  id: string;
  project_id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  notes: string | null;
  projects?: { name: string } | null;
}

interface ConfirmPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfirmPaymentDialog({ payment, open, onOpenChange, onSuccess }: ConfirmPaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [feeType, setFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [feeValue, setFeeValue] = useState('0');
  const [confirmedAt, setConfirmedAt] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [receiptInfo, setReceiptInfo] = useState('');

  const amount = payment?.amount || 0;
  
  const feeAmount = feeType === 'percentage' 
    ? (amount * parseFloat(feeValue || '0')) / 100 
    : parseFloat(feeValue || '0');
  
  const feePercentage = feeType === 'percentage' 
    ? parseFloat(feeValue || '0') 
    : amount > 0 ? (parseFloat(feeValue || '0') / amount) * 100 : 0;

  const netAmount = amount - feeAmount;

  useEffect(() => {
    if (open && payment) {
      setPaymentMethod('');
      setFeeType('percentage');
      setFeeValue('0');
      setConfirmedAt(new Date().toISOString().split('T')[0]);
      setReleaseDate('');
      setReceiptInfo('');
    }
  }, [open, payment]);

  useEffect(() => {
    if (paymentMethod) {
      const method = paymentMethods.find(m => m.value === paymentMethod);
      if (method) {
        setFeeType(method.defaultFee.type);
        setFeeValue(method.defaultFee.value.toString());
      }
      // Auto-calcular data de liberação para Mercado Pago (+7 dias)
      if (paymentMethod === 'mercado_pago_loan' && confirmedAt) {
        const date = new Date(confirmedAt + 'T12:00:00');
        date.setDate(date.getDate() + 7);
        setReleaseDate(date.toISOString().split('T')[0]);
      } else {
        setReleaseDate('');
      }
    }
  }, [paymentMethod, confirmedAt]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !paymentMethod) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        net_amount: netAmount,
        confirmed_at: confirmedAt ? new Date(confirmedAt + 'T12:00:00').toISOString() : new Date().toISOString(),
        release_date: releaseDate || null,
        receipt_info: receiptInfo || null,
        payment_date: payment.payment_date || confirmedAt || new Date().toISOString().split('T')[0],
      })
      .eq('id', payment.id);

    setIsSubmitting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao confirmar pagamento', description: error.message });
    } else {
      toast({ 
        title: 'Pagamento confirmado!', 
        description: `${formatCurrency(netAmount)} líquido recebido via ${paymentMethods.find(m => m.value === paymentMethod)?.label}` 
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Dar Baixa no Pagamento
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes do recebimento de {payment?.projects?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor Original */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">Valor Original</p>
            <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <PaymentMethodSelect value={paymentMethod} onValueChange={setPaymentMethod} />
          </div>

          {/* Taxa */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Taxa do Pagamento
            </Label>
            
            <RadioGroup 
              value={feeType} 
              onValueChange={(v) => setFeeType(v as 'percentage' | 'fixed')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">Percentual (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">Valor Fixo (R$)</Label>
              </div>
            </RadioGroup>

            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {feeType === 'percentage' ? '%' : 'R$'}
              </span>
            </div>

            {feeAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Taxa: {formatCurrency(feeAmount)} 
                {feeType === 'fixed' && ` (${feePercentage.toFixed(2)}%)`}
              </p>
            )}
          </div>

          {/* Valor Líquido */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-sm text-muted-foreground">Valor Líquido a Receber</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(netAmount)}</p>
          </div>

          {/* Data de Confirmação */}
          <div className="space-y-2">
            <Label>Data de Confirmação</Label>
            <Input 
              type="date" 
              value={confirmedAt} 
              onChange={(e) => setConfirmedAt(e.target.value)} 
            />
          </div>

          {/* Data de Liberação (apenas para Mercado Pago) */}
          {paymentMethod === 'mercado_pago_loan' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Data de Liberação (MP)
              </Label>
              <Input 
                type="date" 
                value={releaseDate} 
                onChange={(e) => setReleaseDate(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">
                Data prevista para o dinheiro cair na conta
              </p>
            </div>
          )}

          {/* Comprovante */}
          <div className="space-y-2">
            <Label>Informações do Comprovante</Label>
            <Textarea 
              value={receiptInfo} 
              onChange={(e) => setReceiptInfo(e.target.value)} 
              placeholder="Número do comprovante, referência, etc."
              rows={2}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!paymentMethod || isSubmitting} className="gap-2">
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Confirmar Baixa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
