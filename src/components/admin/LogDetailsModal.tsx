import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogActionBadge } from "./LogActionBadge";
import { getEntityTypeLabel, getRelativeTime } from "@/lib/logUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, User, FileText, Clock, Database } from "lucide-react";

interface LogDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    user_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string | null;
  } | null;
  userName: string;
}

export function LogDetailsModal({ open, onOpenChange, log, userName }: LogDetailsModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Log
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ação:</span>
            <LogActionBadge action={log.action} />
          </div>

          <Separator />

          {/* Info Grid */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Executado por</p>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data e Hora</p>
                <p className="text-sm text-muted-foreground">
                  {log.created_at && format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({getRelativeTime(log.created_at || "")})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Database className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tipo de Entidade</p>
                <Badge variant="secondary">{getEntityTypeLabel(log.entity_type)}</Badge>
              </div>
            </div>

            {log.entity_id && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">ID da Entidade</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{log.entity_id}</code>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          {log.details && Object.keys(log.details).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalhes Completos
                </p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {Object.entries(log.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-sm font-medium text-right">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Log ID */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              ID do Log: <code className="bg-muted px-1 rounded">{log.id}</code>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
