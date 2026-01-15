import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckSquare,
  DollarSign,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

const notificationConfig: Record<
  string,
  { icon: typeof AlertTriangle; color: string; bgColor: string }
> = {
  deadline_warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  deadline_urgent: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  deadline_overdue: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  task_due_1: {
    icon: CheckSquare,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  task_due_3: {
    icon: CheckSquare,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  task_overdue: {
    icon: CheckSquare,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  payment_pending: {
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  payment_overdue: {
    icon: DollarSign,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

const defaultConfig = {
  icon: Clock,
  color: 'text-muted-foreground',
  bgColor: 'bg-muted',
};

function getLink(notification: Notification): string {
  switch (notification.reference_type) {
    case 'project':
      return '/projects';
    case 'task':
      return '/tasks';
    case 'payment':
      return '/finances';
    default:
      return '/notifications';
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const config = notificationConfig[notification.type] || defaultConfig;
  const Icon = config.icon;

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 shrink-0 rounded-lg p-2', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content - Link wrapper */}
      <Link
        to={getLink(notification)}
        onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
        className="flex-1 min-w-0"
      >
        <div className="flex items-start justify-between gap-2 pr-20">
          <div>
            <p
              className={cn(
                'text-sm leading-tight',
                !notification.is_read && 'font-medium'
              )}
            >
              {notification.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </Link>

      {/* Unread indicator */}
      {!notification.is_read && (
        <span className="absolute right-20 top-4 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}

      {/* Action buttons */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={handleMarkAsRead}
            title="Marcar como lida"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            title="Excluir"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
