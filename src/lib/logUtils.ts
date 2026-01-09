import { UserPlus, UserX, UserCheck, RefreshCw, Edit, Trash2, Eye, Shield, CreditCard, LucideIcon } from "lucide-react";

export interface ActionConfig {
  label: string;
  icon: LucideIcon;
  color: "success" | "destructive" | "warning" | "info" | "default";
}

export const actionMap: Record<string, ActionConfig> = {
  create_user: { label: "Usuário criado", icon: UserPlus, color: "success" },
  deactivate_user: { label: "Usuário desativado", icon: UserX, color: "destructive" },
  activate_user: { label: "Usuário ativado", icon: UserCheck, color: "success" },
  renew_plan: { label: "Plano renovado", icon: RefreshCw, color: "info" },
  update_profile: { label: "Perfil atualizado", icon: Edit, color: "warning" },
  delete_user: { label: "Usuário excluído", icon: Trash2, color: "destructive" },
  view_user: { label: "Usuário visualizado", icon: Eye, color: "default" },
  change_role: { label: "Permissão alterada", icon: Shield, color: "warning" },
  update_subscription: { label: "Assinatura atualizada", icon: CreditCard, color: "info" },
};

export const entityTypeMap: Record<string, string> = {
  user: "Usuário",
  project: "Projeto",
  client: "Cliente",
  task: "Tarefa",
  payment: "Pagamento",
  profile: "Perfil",
  subscription: "Assinatura",
};

export function getActionConfig(action: string): ActionConfig {
  return actionMap[action] || { 
    label: action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    icon: Eye, 
    color: "default" 
  };
}

export function getEntityTypeLabel(entityType: string): string {
  return entityTypeMap[entityType.toLowerCase()] || entityType;
}

export function formatLogDetails(action: string, details: Record<string, unknown> | null, entityType: string): string {
  if (!details) return "-";

  switch (action) {
    case "create_user":
      return `Criou usuário ${details.user_name ? `**${details.user_name}**` : ""} ${details.email ? `(${details.email})` : ""} ${details.plan ? `com plano **${details.plan}**` : ""}`.trim();
    
    case "deactivate_user":
      return `Desativou o usuário ${details.user_name ? `**${details.user_name}**` : details.email ? `**${details.email}**` : ""}`.trim();
    
    case "activate_user":
      return `Ativou o usuário ${details.user_name ? `**${details.user_name}**` : details.email ? `**${details.email}**` : ""}`.trim();
    
    case "renew_plan":
      return `Renovou plano de ${details.user_name ? `**${details.user_name}**` : ""} para **${details.plan_type || details.new_plan || "N/A"}** ${details.end_date ? `até **${formatDate(details.end_date as string)}**` : ""}`.trim();
    
    case "update_profile":
      return `Atualizou perfil ${details.user_name ? `de **${details.user_name}**` : ""}`.trim();
    
    case "update_subscription":
      return `Atualizou assinatura ${details.user_name ? `de **${details.user_name}**` : ""} ${details.plan_type ? `para **${details.plan_type}**` : ""}`.trim();

    default:
      // Try to build a generic description from details
      const parts: string[] = [];
      if (details.user_name) parts.push(`Usuário: **${details.user_name}**`);
      if (details.email) parts.push(`Email: ${details.email}`);
      if (details.plan || details.plan_type) parts.push(`Plano: ${details.plan || details.plan_type}`);
      return parts.length > 0 ? parts.join(" • ") : JSON.stringify(details).slice(0, 100);
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  
  return date.toLocaleDateString("pt-BR");
}
