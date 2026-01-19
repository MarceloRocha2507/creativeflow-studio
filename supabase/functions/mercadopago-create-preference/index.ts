import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreferenceRequest {
  paymentId: string;
  amount: number;
  title: string;
  description?: string;
}

interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Initialize Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[MP Create Preference] Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Parse request body
    const body: PreferenceRequest = await req.json();
    const { paymentId, amount, title, description } = body;

    console.log('[MP Create Preference] Request:', { paymentId, amount, title, userId: user.id });

    if (!paymentId || !amount || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verify the payment belongs to the user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, user_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('[MP Create Preference] Payment not found:', paymentError);
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Get access token
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('[MP Create Preference] Missing MERCADOPAGO_ACCESS_TOKEN');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Create preference in Mercado Pago
    const preferenceData = {
      items: [
        {
          title: title,
          description: description || title,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: paymentId,
      back_urls: {
        success: `${req.headers.get('origin') || 'https://hub-painel.lovable.app'}/finances?payment_status=success`,
        failure: `${req.headers.get('origin') || 'https://hub-painel.lovable.app'}/finances?payment_status=failure`,
        pending: `${req.headers.get('origin') || 'https://hub-painel.lovable.app'}/finances?payment_status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
    };

    console.log('[MP Create Preference] Creating preference:', JSON.stringify(preferenceData));

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('[MP Create Preference] MP API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create preference' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const mpPreference: MercadoPagoPreference = await mpResponse.json();
    console.log('[MP Create Preference] Preference created:', {
      id: mpPreference.id,
      init_point: mpPreference.init_point,
    });

    // Determine which URL to use based on token type
    const isTestToken = accessToken.startsWith('TEST-');
    const paymentUrl = isTestToken ? mpPreference.sandbox_init_point : mpPreference.init_point;

    // Update payment with preference info using service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        mercadopago_preference_id: mpPreference.id,
        mercadopago_init_point: paymentUrl,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('[MP Create Preference] Error updating payment:', updateError);
      // Don't fail the request, the preference was still created
    }

    return new Response(JSON.stringify({
      success: true,
      preference_id: mpPreference.id,
      init_point: paymentUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[MP Create Preference] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
