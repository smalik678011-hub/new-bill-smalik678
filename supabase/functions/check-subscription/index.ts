import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Admin Client using privileged credentials to verify limits
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // 2. Parse request payload
    let userId: string | null = null;
    try {
      const body = await req.json();
      userId = body.userId;
    } catch {
      // Fallback if payload isn't json or can't be read
    }

    // Extract authorization key fallback from header JWT
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: jwtError } = await supabaseClient.auth.getUser(token);
        if (!jwtError && user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "व्यक्तिगत यूजर आईडी / Auth Token आवश्यक है (userId/Auth Token is required)" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Retrieve user profile and plan level
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('plan, business_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "यूज़र डेटाबेस में नहीं मिला (User profile not found)" 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { plan = 'FREE', business_id } = userProfile;

    // If premium PRO or YEARLY, bypass limits completely
    if (plan !== 'FREE') {
      return new Response(JSON.stringify({
        allowed: true,
        plan,
        count: 0,
        limit: Infinity,
        message: "Unlimited billing enabled for PRO users."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Check active business reference
    if (!business_id) {
      return new Response(JSON.stringify({
        allowed: true,
        plan: 'FREE',
        count: 0,
        limit: 5,
        message: "No business created yet. Active limit is intact."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Conduct count querying
    const { count, error: countError } = await supabaseClient
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id);

    if (countError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "डाटा संकलन में त्रुटि (Failed to calculate invoice count)" 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const invoiceCount = count || 0;
    const maxFreeLimit = 5;
    const isAllowed = invoiceCount < maxFreeLimit;

    return new Response(JSON.stringify({
      allowed: isAllowed,
      plan: 'FREE',
      count: invoiceCount,
      limit: maxFreeLimit,
      message: isAllowed 
        ? "जमा करने की अनुमति है (Invoice allowed)" 
        : "आपने मुफ़्त इनवॉइस की अंतिम सीमा (5) पार कर ली है। कृपया नवीन पक्के बिल बनाने के लिए PRO प्लान में अपग्रेड करें।"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || 'Internal connection failure' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
