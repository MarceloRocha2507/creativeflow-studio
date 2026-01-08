import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckSquare,
  DollarSign,
} from 'lucide-react';

type FilterType = 'all' | 'deadlines' | 'tasks' | 'payments';

const filterConfig: Record<FilterType, { label: string; types: string[] }> = {
  all: { label: 'Todas', types: [] },
  deadlines: {
    label: 'Prazos',
    types: ['deadline_warning', 'deadline_urgent', 'deadline_overdue'],
  },
  tasks: {
    label: 'Tarefas',
    types: ['task_due_1', 'task_due_3', 'task_overdue'],
  },
  payments: {
    label: 'Pagamentos',
    types: ['payment_pending', 'payment_overdue'],
  },
};

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) =>
          filterConfig[filter].types.includes(n.type)
        );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Notificações</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Todas lidas'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as FilterType)}
            >
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Todas
                </TabsTrigger>
                <TabsTrigger value="deadlines" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Prazos
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pagamentos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhuma notificação</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter === 'all'
                    ? 'Você está em dia com tudo!'
                    : `Nenhuma notificação de ${filterConfig[filter].label.toLowerCase()}`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    showDelete
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
