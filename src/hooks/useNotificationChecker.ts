import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, isAfter, isBefore, startOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationSettings {
  deadline_days: number[];
  payment_reminder: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  deadline_days: [1, 3, 7],
  payment_reminder: true,
};

export function useNotificationChecker() {
  const { user } = useAuth();

  const checkAndCreateNotifications = useCallback(async () => {
    if (!user) return;

    const today = startOfDay(new Date());

    // Fetch settings
    const { data: settingsData } = await supabase
      .from('notification_settings')
      .select('deadline_days, payment_reminder')
      .eq('user_id', user.id)
      .single();

    const settings: NotificationSettings = settingsData || DEFAULT_SETTINGS;

    // Fetch existing notification references to avoid duplicates
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('reference_type, reference_id, type')
      .eq('user_id', user.id);

    const existingRefs = new Set(
      existingNotifications?.map(
        (n) => `${n.reference_type}-${n.reference_id}-${n.type}`
      ) || []
    );

    const newNotifications: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
      reference_type: string;
      reference_id: string;
    }> = [];

    // Check projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, deadline, status')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .not('deadline', 'is', null);

    projects?.forEach((project) => {
      if (!project.deadline) return;
      const deadline = startOfDay(new Date(project.deadline));

      // Check if overdue
      if (isBefore(deadline, today)) {
        const refKey = `project-${project.id}-deadline_overdue`;
        if (!existingRefs.has(refKey)) {
          newNotifications.push({
            user_id: user.id,
            type: 'deadline_overdue',
            title: 'Projeto Atrasado!',
            message: `O projeto "${project.name}" está atrasado desde ${format(deadline, "dd 'de' MMMM", { locale: ptBR })}.`,
            reference_type: 'project',
            reference_id: project.id,
          });
        }
      } else {
        // Check upcoming deadlines
        settings.deadline_days.forEach((days) => {
          const alertDate = addDays(today, days);
          if (
            isAfter(deadline, addDays(today, days - 1)) &&
            isBefore(deadline, addDays(today, days + 1))
          ) {
            const type = days === 1 ? 'deadline_urgent' : 'deadline_warning';
            const refKey = `project-${project.id}-${type}`;
            if (!existingRefs.has(refKey)) {
              newNotifications.push({
                user_id: user.id,
                type,
                title: days === 1 ? 'Prazo Urgente!' : 'Prazo Próximo',
                message: `O projeto "${project.name}" vence ${days === 1 ? 'amanhã' : `em ${days} dias`}.`,
                reference_type: 'project',
                reference_id: project.id,
              });
            }
          }
        });
      }
    });

    // Check tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .not('due_date', 'is', null);

    tasks?.forEach((task) => {
      if (!task.due_date) return;
      const dueDate = startOfDay(new Date(task.due_date));

      // Check if overdue
      if (isBefore(dueDate, today)) {
        const refKey = `task-${task.id}-task_overdue`;
        if (!existingRefs.has(refKey)) {
          newNotifications.push({
            user_id: user.id,
            type: 'task_overdue',
            title: 'Tarefa Atrasada!',
            message: `A tarefa "${task.title}" está atrasada.`,
            reference_type: 'task',
            reference_id: task.id,
          });
        }
      } else {
        // Check if due today or tomorrow
        [1, 3].forEach((days) => {
          const alertDate = addDays(today, days);
          if (
            isAfter(dueDate, addDays(today, days - 1)) &&
            isBefore(dueDate, addDays(today, days + 1))
          ) {
            const refKey = `task-${task.id}-task_due_${days}`;
            if (!existingRefs.has(refKey)) {
              newNotifications.push({
                user_id: user.id,
                type: `task_due_${days}`,
                title: days === 1 ? 'Tarefa Vence Amanhã!' : 'Tarefa Próxima',
                message: `A tarefa "${task.title}" vence ${days === 1 ? 'amanhã' : `em ${days} dias`}.`,
                reference_type: 'task',
                reference_id: task.id,
              });
            }
          }
        });
      }
    });

    // Check pending payments
    if (settings.payment_reminder) {
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, project_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const thirtyDaysAgo = addDays(today, -30);

      payments?.forEach((payment) => {
        const createdAt = new Date(payment.created_at);
        if (isBefore(createdAt, thirtyDaysAgo)) {
          const refKey = `payment-${payment.id}-payment_overdue`;
          if (!existingRefs.has(refKey)) {
            newNotifications.push({
              user_id: user.id,
              type: 'payment_overdue',
              title: 'Pagamento Pendente!',
              message: `Um pagamento de R$ ${payment.amount.toLocaleString('pt-BR')} está pendente há mais de 30 dias.`,
              reference_type: 'payment',
              reference_id: payment.id,
            });
          }
        }
      });
    }

    // Insert new notifications
    if (newNotifications.length > 0) {
      await supabase.from('notifications').insert(newNotifications);
    }
  }, [user]);

  useEffect(() => {
    // Check on mount and every 5 minutes
    checkAndCreateNotifications();
    const interval = setInterval(checkAndCreateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndCreateNotifications]);

  return { checkNow: checkAndCreateNotifications };
}
