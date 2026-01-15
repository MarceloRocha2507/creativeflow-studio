import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Inbox,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
}

function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
  onDelete,
  defaultOpen = true,
}: NotificationGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="uppercase tracking-wider">{title}</span>
        <span className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-muted-foreground/70">
            {notifications.length}
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="divide-y divide-border/30">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const filteredNotifications = useMemo(() => {
    return filter === 'all'
      ? notifications
      : notifications.filter((n) =>
          filterConfig[filter].types.includes(n.type)
        );
  }, [notifications, filter]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const deadlineTypes = filterConfig.deadlines.types;
    const paymentTypes = filterConfig.payments.types;
    const taskTypes = filterConfig.tasks.types;

    return {
      total: notifications.length,
      unread: unreadCount,
      deadlines: notifications.filter((n) => deadlineTypes.includes(n.type) && !n.is_read).length,
      payments: notifications.filter((n) => paymentTypes.includes(n.type) && !n.is_read).length,
      tasks: notifications.filter((n) => taskTypes.includes(n.type) && !n.is_read).length,
    };
  }, [notifications, unreadCount]);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                <span className="hidden sm:inline">Marcar todas</span>
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
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Bell}
            label="Total"
            value={stats.total}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            icon={Inbox}
            label="Não lidas"
            value={stats.unread}
            color="text-accent"
            bgColor="bg-accent/10"
          />
          <StatCard
            icon={AlertTriangle}
            label="Prazos"
            value={stats.deadlines}
            color="text-warning"
            bgColor="bg-warning/10"
          />
          <StatCard
            icon={DollarSign}
            label="Pagamentos"
            value={stats.payments}
            color="text-destructive"
            bgColor="bg-destructive/10"
          />
        </div>

        {/* Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <div className="border-b border-border/30 p-3">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as FilterType)}
            >
              <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex-wrap gap-1">
                <TabsTrigger
                  value="all"
                  className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-1.5"
                >
                  <Bell className="h-4 w-4" />
                  <span>Todas</span>
                  <span className="rounded-full bg-muted px-1.5 text-xs">
                    {stats.total}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="deadlines"
                  className="gap-2 data-[state=active]:bg-warning/10 data-[state=active]:text-warning rounded-lg px-3 py-1.5"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Prazos</span>
                  {stats.deadlines > 0 && (
                    <span className="rounded-full bg-warning/20 px-1.5 text-xs text-warning">
                      {stats.deadlines}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="gap-2 data-[state=active]:bg-accent/10 data-[state=active]:text-accent rounded-lg px-3 py-1.5"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Tarefas</span>
                  {stats.tasks > 0 && (
                    <span className="rounded-full bg-accent/20 px-1.5 text-xs text-accent">
                      {stats.tasks}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="gap-2 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive rounded-lg px-3 py-1.5"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Pagamentos</span>
                  {stats.payments > 0 && (
                    <span className="rounded-full bg-destructive/20 px-1.5 text-xs text-destructive">
                      {stats.payments}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Notification List */}
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
              <div className="divide-y divide-border/50">
                <NotificationGroup
                  title="Hoje"
                  notifications={groupedNotifications.today}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
                <NotificationGroup
                  title="Ontem"
                  notifications={groupedNotifications.yesterday}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
                <NotificationGroup
                  title="Esta semana"
                  notifications={groupedNotifications.thisWeek}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  defaultOpen={groupedNotifications.today.length === 0 && groupedNotifications.yesterday.length === 0}
                />
                <NotificationGroup
                  title="Anteriores"
                  notifications={groupedNotifications.older}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  defaultOpen={false}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
