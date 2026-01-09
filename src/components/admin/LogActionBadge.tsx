import { Badge } from "@/components/ui/badge";
import { getActionConfig } from "@/lib/logUtils";
import { cn } from "@/lib/utils";

interface LogActionBadgeProps {
  action: string;
}

const colorClasses = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  default: "bg-muted text-muted-foreground border-border",
};

export function LogActionBadge({ action }: LogActionBadgeProps) {
  const config = getActionConfig(action);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-medium border",
        colorClasses[config.color]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
