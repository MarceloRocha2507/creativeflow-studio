import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusPayload {
  active_orders: number;
  accepting_orders: boolean;
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

    const { active_orders, accepting_orders }: StatusPayload = await req.json();

    // Update status in database
    const { data: existingStatus } = await supabase
      .from('shop_status')
      .select('id')
      .limit(1)
      .single();

    if (existingStatus) {
      await supabase
        .from('shop_status')
        .update({
          active_orders,
          accepting_orders,
          updated_by: user.id,
        })
        .eq('id', existingStatus.id);
    } else {
      await supabase
        .from('shop_status')
        .insert({
          active_orders,
          accepting_orders,
          updated_by: user.id,
        });
    }

    // Format message for Discord
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const acceptingEmoji = accepting_orders ? '✅' : '❌';
    const acceptingText = accepting_orders ? 'SIM' : 'NÃO';

    const discordMessage = {
      embeds: [
        {
          title: '📦 STATUS DA LOJA',
          color: accepting_orders ? 0x22c55e : 0xef4444, // green or red
          fields: [
            {
              name: '📊 Encomendas Ativas',
              value: `**${active_orders}**`,
              inline: true,
            },
            {
              name: `${acceptingEmoji} Aceitando Novas Encomendas`,
              value: `**${acceptingText}**`,
              inline: true,
            },
          ],
          footer: {
            text: `🕐 Atualizado: ${formattedDate} às ${formattedTime}`,
          },
          timestamp: now.toISOString(),
        },
      ],
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
        active_orders,
        accepting_orders,
        discord_sent: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Status updated and sent to Discord' }),
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
