import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  date_approved: string | null;
  transaction_amount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    console.log('[MP Webhook] Received notification:', { topic, paymentId });

    // Only process payment notifications
    if (topic !== 'payment' && topic !== 'merchant_order') {
      console.log('[MP Webhook] Ignoring non-payment topic:', topic);
      return new Response(JSON.stringify({ message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Parse body for POST notifications (v2 format)
    let mpPaymentId = paymentId;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('[MP Webhook] Body:', JSON.stringify(body));
        if (body.data?.id) {
          mpPaymentId = body.data.id;
        }
        if (body.action && body.action !== 'payment.created' && body.action !== 'payment.updated') {
          console.log('[MP Webhook] Ignoring action:', body.action);
          return new Response(JSON.stringify({ message: 'Ignored' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      } catch {
        // Body might be empty for GET requests
      }
    }

    if (!mpPaymentId) {
      console.log('[MP Webhook] No payment ID found');
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get the access token
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('[MP Webhook] Missing MERCADOPAGO_ACCESS_TOKEN');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Fetch payment details from Mercado Pago API
    console.log('[MP Webhook] Fetching payment details for ID:', mpPaymentId);
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('[MP Webhook] Error fetching payment:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch payment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const mpPayment: MercadoPagoPayment = await mpResponse.json();
    console.log('[MP Webhook] Payment details:', JSON.stringify({
      id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      external_reference: mpPayment.external_reference,
      amount: mpPayment.transaction_amount,
    }));

    // Get external_reference (our payment ID)
    const ourPaymentId = mpPayment.external_reference;
    if (!ourPaymentId) {
      console.log('[MP Webhook] No external_reference found, skipping');
      return new Response(JSON.stringify({ message: 'No reference' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Map MP status to our status
    let newStatus: string | null = null;
    let paymentDate: string | null = null;

    if (mpPayment.status === 'approved') {
      newStatus = 'paid';
      paymentDate = mpPayment.date_approved 
        ? new Date(mpPayment.date_approved).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
    } else if (mpPayment.status === 'pending' || mpPayment.status === 'in_process') {
      newStatus = 'pending';
    }
    // rejected, cancelled, refunded - we keep as pending or handle separately

    if (newStatus) {
      console.log('[MP Webhook] Updating payment:', ourPaymentId, 'to status:', newStatus);
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
        mercadopago_payment_id: mpPayment.id.toString(),
      };

      if (paymentDate) {
        updateData.payment_date = paymentDate;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', ourPaymentId);

      if (error) {
        console.error('[MP Webhook] Error updating payment:', error);
        return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('[MP Webhook] Payment updated successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[MP Webhook] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
