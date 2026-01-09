import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Loader2, LogOut, Lock, User, Bell } from 'lucide-react';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
}

interface NotificationSettings {
  id?: string;
  deadline_days: number[];
  payment_reminder: boolean;
  daily_summary: boolean;
}

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    deadline_days: [1, 3, 7],
    payment_reminder: true,
    daily_summary: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, notifRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('notification_settings').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setFullName(profileRes.data.full_name || '');
      setPhone(profileRes.data.phone || '');
    }

    if (notifRes.data) {
      setNotificationSettings({
        id: notifRes.data.id,
        deadline_days: notifRes.data.deadline_days || [1, 3, 7],
        payment_reminder: notifRes.data.payment_reminder ?? true,
        daily_summary: notifRes.data.daily_summary ?? true,
      });
    }

    setIsLoading(false);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione uma imagem' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A imagem deve ter no máximo 5MB' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new URL
      const { error: updateError } = await supabase.from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast({ title: 'Avatar atualizado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar avatar', description: error.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setProfileErrors({});

    const result = profileSchema.safeParse({ fullName, phone });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setProfileErrors(errors);
      return;
    }

    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase.from('profiles').update({
      full_name: fullName || null,
      phone: phone || null,
    }).eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Perfil atualizado!' });
      fetchData();
    }
  };

  const changePassword = async () => {
    setPasswordErrors({});

    const result = passwordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setIsSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSavingPassword(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar senha', description: error.message });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;
    setIsSavingNotifications(true);

    const payload = {
      user_id: user.id,
      deadline_days: notificationSettings.deadline_days,
      payment_reminder: notificationSettings.payment_reminder,
      daily_summary: notificationSettings.daily_summary,
    };

    let error;
    if (notificationSettings.id) {
      const res = await supabase
        .from('notification_settings')
        .update(payload)
        .eq('id', notificationSettings.id);
      error = res.error;
    } else {
      const res = await supabase.from('notification_settings').insert([payload]);
      error = res.error;
    }

    setIsSavingNotifications(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Preferências atualizadas!' });
      fetchData();
    }
  };

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
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
        {/* Header Compacto com Avatar */}
        <div className="flex items-center gap-4 mb-2">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
              <AvatarImage src={profile?.logo_url || undefined} />
              <AvatarFallback className="text-lg gradient-primary text-primary-foreground">
                {getInitials(profile?.full_name || null, user?.email || null)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">
              {profile?.full_name || 'Seu Nome'}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Personal Information */}
        <Card className="glass-card glass-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-sm">Nome Completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="glass border-white/10 h-9"
                />
                {profileErrors.fullName && (
                  <p className="text-xs text-destructive">{profileErrors.fullName}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="glass border-white/10 h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="glass border-white/10 bg-muted/30 h-9"
                />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={isSaving} size="sm" className="gradient-primary glow-primary">
              {isSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Salvando...</> : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="glass-card glass-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Alterar Senha</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-sm">Senha Atual</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass border-white/10 h-9"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass border-white/10 h-9"
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Confirmar</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass border-white/10 h-9"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <Button onClick={changePassword} disabled={isSavingPassword} size="sm" className="gradient-primary glow-primary">
              {isSavingPassword ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Alterando...</> : 'Alterar Senha'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="glass-card glass-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Notificações</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between rounded-lg glass glass-border p-3">
              <div>
                <Label className="text-sm">Lembretes de Pagamento</Label>
                <p className="text-xs text-muted-foreground">Alertas sobre pagamentos pendentes</p>
              </div>
              <Switch
                checked={notificationSettings.payment_reminder}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, payment_reminder: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg glass glass-border p-3">
              <div>
                <Label className="text-sm">Resumo Diário</Label>
                <p className="text-xs text-muted-foreground">Resumo diário de pendências</p>
              </div>
              <Switch
                checked={notificationSettings.daily_summary}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({ ...prev, daily_summary: checked }))
                }
              />
            </div>

            <Button
              onClick={saveNotificationSettings}
              disabled={isSavingNotifications}
              size="sm"
              className="gradient-primary glow-primary"
            >
              {isSavingNotifications ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Salvando...</>
              ) : (
                'Salvar Preferências'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="glass-card glass-border border-destructive/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-destructive">Sair da Conta</h3>
                <p className="text-xs text-muted-foreground">Desconectar de todos os dispositivos</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <LogOut className="h-3 w-3" />
                    Sair
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-card glass-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja sair da sua conta?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="glass border-white/10">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={signOut} className="bg-destructive hover:bg-destructive/90">
                      Sair
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
