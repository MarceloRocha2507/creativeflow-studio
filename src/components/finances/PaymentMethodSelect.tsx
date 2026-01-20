import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Banknote, QrCode, Receipt, Building2, Coins } from 'lucide-react';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'cash' | 'transfer';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  defaultFee: { type: 'percentage' | 'fixed'; value: number };
}

export const paymentMethods: PaymentMethodOption[] = [
  { value: 'pix', label: 'PIX', icon: <QrCode className="h-4 w-4" />, defaultFee: { type: 'percentage', value: 0 } },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard className="h-4 w-4" />, defaultFee: { type: 'percentage', value: 3.99 } },
  { value: 'debit_card', label: 'Cartão de Débito', icon: <CreditCard className="h-4 w-4" />, defaultFee: { type: 'percentage', value: 1.99 } },
  { value: 'boleto', label: 'Boleto Bancário', icon: <Receipt className="h-4 w-4" />, defaultFee: { type: 'fixed', value: 3.50 } },
  { value: 'cash', label: 'Dinheiro', icon: <Coins className="h-4 w-4" />, defaultFee: { type: 'percentage', value: 0 } },
  { value: 'transfer', label: 'Transferência Bancária', icon: <Building2 className="h-4 w-4" />, defaultFee: { type: 'percentage', value: 0 } },
];

export const getPaymentMethodLabel = (method: string | null | undefined): string => {
  return paymentMethods.find(m => m.value === method)?.label || method || '-';
};

interface PaymentMethodSelectProps {
  value: PaymentMethod | '';
  onValueChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelect({ value, onValueChange }: PaymentMethodSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as PaymentMethod)}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a forma de pagamento" />
      </SelectTrigger>
      <SelectContent>
        {paymentMethods.map((method) => (
          <SelectItem key={method.value} value={method.value}>
            <div className="flex items-center gap-2">
              {method.icon}
              <span>{method.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
