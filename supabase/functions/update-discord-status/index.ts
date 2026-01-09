import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusPayload {
  accepting_orders: boolean;
  estimated_start_time?: string;
  custom_message?: string;
  logo_url?: string;
}

interface ProjectStats {
  in_progress: number;
  completed_this_month: number;
  pending: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');

    if (!discordWebhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL not configured');
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    
    if (!isAdmin) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { accepting_orders, estimated_start_time, custom_message, logo_url }: StatusPayload = await req.json();

    // Get project statistics automatically
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count projects by status
    const { data: inProgressData, count: inProgressCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const { data: pendingData, count: pendingCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: completedData, count: completedCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', firstDayOfMonth.toISOString());

    const stats: ProjectStats = {
      in_progress: inProgressCount || 0,
      completed_this_month: completedCount || 0,
      pending: pendingCount || 0,
    };

    // Update status in database
    const { data: existingStatus } = await supabase
      .from('shop_status')
      .select('id')
      .limit(1)
      .single();

    const statusData = {
      active_orders: stats.in_progress,
      accepting_orders,
      estimated_start_time: estimated_start_time || null,
      custom_message: custom_message || null,
      logo_url: logo_url || null,
      updated_by: user.id,
    };

    if (existingStatus) {
      await supabase
        .from('shop_status')
        .update(statusData)
        .eq('id', existingStatus.id);
    } else {
      await supabase
        .from('shop_status')
        .insert(statusData);
    }

    // Format message for Discord
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const acceptingEmoji = accepting_orders ? '✅' : '🔴';
    const acceptingStatus = accepting_orders 
      ? '**ACEITANDO NOVOS PROJETOS**\nEstamos disponíveis para novos trabalhos!' 
      : '**TEMPORARIAMENTE FECHADO**\nNo momento não estamos aceitando novos projetos.';

    // Build professional embed fields
    const fields = [
      {
        name: '📦 Em Andamento',
        value: `\`\`\`${stats.in_progress} projeto${stats.in_progress !== 1 ? 's' : ''}\`\`\``,
        inline: true,
      },
      {
        name: '✅ Concluídos (mês)',
        value: `\`\`\`${stats.completed_this_month} projeto${stats.completed_this_month !== 1 ? 's' : ''}\`\`\``,
        inline: true,
      },
      {
        name: '⏳ Na Fila',
        value: `\`\`\`${stats.pending} projeto${stats.pending !== 1 ? 's' : ''}\`\`\``,
        inline: true,
      },
      {
        name: `${acceptingEmoji} Disponibilidade`,
        value: acceptingStatus,
        inline: false,
      },
    ];

    // Add estimated start time if provided
    if (estimated_start_time && estimated_start_time.trim()) {
      fields.push({
        name: '⏱️ Previsão de Início',
        value: `Novos projetos: **${estimated_start_time}**`,
        inline: false,
      });
    }

    // Add custom message if provided
    if (custom_message && custom_message.trim()) {
      fields.push({
        name: '💬 Observações',
        value: custom_message,
        inline: false,
      });
    }

    const embed: Record<string, unknown> = {
      title: '📊 Painel de Disponibilidade',
      description: '> Acompanhe em tempo real nossa capacidade de atendimento e situação atual dos projetos.',
      color: accepting_orders ? 0x22c55e : 0xef4444,
      fields,
      footer: {
        text: `🕐 Atualizado em ${formattedDate} às ${formattedTime}`,
      },
      timestamp: now.toISOString(),
    };

    // Add thumbnail if logo_url is provided
    if (logo_url && logo_url.trim()) {
      embed.thumbnail = {
        url: logo_url,
      };
    }

    const discordMessage = {
      embeds: [embed],
    };

    // Send to Discord
    const discordResponse = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      throw new Error(`Discord webhook failed: ${errorText}`);
    }

    // Log the activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update_shop_status',
      entity_type: 'shop_status',
      details: {
        stats,
        accepting_orders,
        estimated_start_time,
        custom_message,
        logo_url,
        discord_sent: true,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Status updated and sent to Discord',
        stats,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
