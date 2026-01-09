import { Badge } from "@/components/ui/badge";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanBadgeProps {
  planType: string;
  endDate?: string | null;
}

const planColors: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary",
  pro: "default",
  business: "default",
};

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export function PlanBadge({ planType, endDate }: PlanBadgeProps) {
  const today = new Date();
  let expirationStatus: "normal" | "warning" | "expired" = "normal";
  let daysUntilExpiration: number | null = null;

  if (endDate) {
    const expDate = parseISO(endDate);
    daysUntilExpiration = differenceInDays(expDate, today);
    
    if (daysUntilExpiration < 0) {
      expirationStatus = "expired";
    } else if (daysUntilExpiration <= 7) {
      expirationStatus = "warning";
    }
  }

  const getBadgeVariant = () => {
    if (expirationStatus === "expired") return "destructive" as const;
    if (expirationStatus === "warning") return "outline" as const;
    return planColors[planType] || "secondary";
  };

  const getExpirationText = () => {
    if (!endDate) return "";
    if (expirationStatus === "expired") return " (Expirado)";
    if (daysUntilExpiration !== null && daysUntilExpiration <= 7) {
      return ` (${daysUntilExpiration}d)`;
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={getBadgeVariant()} className={expirationStatus === "warning" ? "border-yellow-500 text-yellow-600" : ""}>
        {planLabels[planType] || planType}{getExpirationText()}
      </Badge>
      {endDate && (
        <span className="text-xs text-muted-foreground">
          Até {format(parseISO(endDate), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      )}
    </div>
  );
}
