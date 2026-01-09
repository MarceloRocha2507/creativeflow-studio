import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Palette, DollarSign, Loader2, Plus, Trash2, Bell } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  hourly_rate: number | null;
}

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  default_rate: number | null;
  color: string;
}

interface NotificationSettings {
  id?: string;
  deadline_days: number[];
  payment_reminder: boolean;
  daily_summary: boolean;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    deadline_days: [1, 3, 7],
    payment_reminder: true,
    daily_summary: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile form
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // New service type form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, servicesRes, notifRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('service_types').select('*').order('created_at'),
      supabase.from('notification_settings').select('*').eq('user_id', user.id).single(),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setFullName(profileRes.data.full_name || '');
      setBusinessName(profileRes.data.business_name || '');
      setSpecialty(profileRes.data.specialty || '');
      setPhone(profileRes.data.phone || '');
      setHourlyRate(profileRes.data.hourly_rate?.toString() || '');
    }

    if (!servicesRes.error) {
      setServiceTypes(servicesRes.data || []);
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

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase.from('profiles').update({
      full_name: fullName || null,
      business_name: businessName || null,
      specialty: specialty || null,
      phone: phone || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
    }).eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Perfil atualizado!' });
    }
  };

  const addServiceType = async () => {
    if (!user || !newServiceName) return;

    const { error } = await supabase.from('service_types').insert([{
      user_id: user.id,
      name: newServiceName,
      default_rate: newServiceRate ? parseFloat(newServiceRate) : null,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar', description: error.message });
    } else {
      toast({ title: 'Tipo de serviço criado!' });
      setNewServiceName('');
      setNewServiceRate('');
      fetchData();
    }
  };

  const deleteServiceType = async (id: string) => {
    const { error } = await supabase.from('service_types').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Tipo de serviço excluído!' });
      fetchData();
    }
  };

  const toggleDeadlineDay = (day: number) => {
    setNotificationSettings((prev) => ({
      ...prev,
      deadline_days: prev.deadline_days.includes(day)
        ? prev.deadline_days.filter((d) => d !== day)
        : [...prev.deadline_days, day].sort((a, b) => a - b),
    }));
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
      toast({ title: 'Configurações de notificação atualizadas!' });
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl text-gradient">Configurações</h1>
          <p className="text-muted-foreground">Personalize seu perfil e preferências</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass border-white/10">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/20">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2 data-[state=active]:bg-primary/20">
              <Palette className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-primary/20">
              <DollarSign className="h-4 w-4" />
              Cobrança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary/20">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card glass-border">
              <CardHeader>
                <CardTitle className="text-gradient">Informações do Perfil</CardTitle>
                <CardDescription>Seus dados profissionais que aparecerão em relatórios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Negócio / Estúdio</Label>
                    <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Studio Design" className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidade</Label>
                    <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: UI/UX Designer" className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="glass border-white/10 bg-muted/30" />
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={isSaving} className="gradient-primary glow-primary">
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="glass-card glass-border">
              <CardHeader>
                <CardTitle className="text-gradient">Tipos de Serviço</CardTitle>
                <CardDescription>Categorize seus projetos por tipo de trabalho</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Nome do serviço (ex: Logo Design)"
                    className="flex-1 glass border-white/10"
                  />
                  <Input
                    type="number"
                    value={newServiceRate}
                    onChange={(e) => setNewServiceRate(e.target.value)}
                    placeholder="Valor/hora (R$)"
                    className="w-32 glass border-white/10"
                  />
                  <Button onClick={addServiceType} className="gradient-primary gap-2 glow-primary">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {serviceTypes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de serviço cadastrado ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {serviceTypes.map((service, index) => (
                      <div 
                        key={service.id} 
                        className="flex items-center justify-between rounded-xl glass glass-border p-3 transition-all duration-300 hover:scale-[1.01]"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full ring-2 ring-white/20" style={{ backgroundColor: service.color }} />
                          <span className="font-medium">{service.name}</span>
                          {service.default_rate && (
                            <span className="text-sm text-muted-foreground">R$ {service.default_rate}/h</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteServiceType(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="glass-card glass-border">
              <CardHeader>
                <CardTitle className="text-gradient">Configurações de Cobrança</CardTitle>
                <CardDescription>Defina valores padrão para seus projetos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xs space-y-2">
                  <Label>Valor Padrão por Hora (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="0.00"
                    className="glass border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este valor será usado como padrão em novos projetos por hora
                  </p>
                </div>
                <Button onClick={saveProfile} disabled={isSaving} className="gradient-primary glow-primary">
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="glass-card glass-border">
              <CardHeader>
                <CardTitle className="text-gradient">Configurações de Notificações</CardTitle>
                <CardDescription>Personalize quando deseja receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base">Alertas de Prazo</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações quando prazos estiverem próximos
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[1, 3, 7, 14, 30].map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={notificationSettings.deadline_days.includes(day)}
                          onCheckedChange={() => toggleDeadlineDay(day)}
                          className="border-white/20"
                        />
                        <Label htmlFor={`day-${day}`} className="cursor-pointer">
                          {day === 1 ? '1 dia antes' : `${day} dias antes`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl glass glass-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Lembretes de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas sobre pagamentos pendentes há mais de 30 dias
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.payment_reminder}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        payment_reminder: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl glass glass-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Resumo Diário</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo diário de pendências
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.daily_summary}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        daily_summary: checked,
                      }))
                    }
                  />
                </div>

                <Button
                  onClick={saveNotificationSettings}
                  disabled={isSavingNotifications}
                  className="gradient-primary glow-primary"
                >
                  {isSavingNotifications ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
