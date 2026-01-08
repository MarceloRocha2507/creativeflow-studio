import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { Bell, Check, ArrowRight, Loader2 } from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationPopoverProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isLoading: boolean;
}

export function NotificationPopover({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading,
}: NotificationPopoverProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="font-semibold">Notificações</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onMarkAllAsRead}
          >
            <Check className="h-3 w-3" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y divide-border/30">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 p-2">
        <Button
          variant="ghost"
          className="w-full justify-center gap-2 text-sm"
          asChild
        >
          <Link to="/notifications">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
