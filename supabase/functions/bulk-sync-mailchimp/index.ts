import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto as stdCrypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");
    const serverPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");

    if (!apiKey || !listId || !serverPrefix) {
      throw new Error("Mailchimp not configured");
    }

    // Collect all unique customers
    const customerMap = new Map<string, { email: string; firstName: string; lastName: string }>();

    const { data: customers } = await supabase
      .from("customers")
      .select("email, full_name")
      .not("email", "is", null);

    for (const c of customers || []) {
      const email = c.email?.toLowerCase().trim();
      if (!email) continue;
      const parts = (c.full_name || "").trim().split(/\s+/);
      customerMap.set(email, { email, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
    }

    let bookingOffset = 0;
    const batchSize = 1000;
    while (true) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("customer_email, customer_name")
        .eq("payment_status", "paid")
        .range(bookingOffset, bookingOffset + batchSize - 1);
      if (!bookings || bookings.length === 0) break;
      for (const b of bookings) {
        const email = b.customer_email?.toLowerCase().trim();
        if (!email || customerMap.has(email)) continue;
        const parts = (b.customer_name || "").trim().split(/\s+/);
        customerMap.set(email, { email, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
      }
      if (bookings.length < batchSize) break;
      bookingOffset += batchSize;
    }

    const { data: giftCards } = await supabase
      .from("gift_cards")
      .select("purchaser_email, purchaser_name")
      .eq("payment_status", "paid");

    for (const gc of giftCards || []) {
      const email = gc.purchaser_email?.toLowerCase().trim();
      if (!email || customerMap.has(email)) continue;
      const parts = (gc.purchaser_name || "").trim().split(/\s+/);
      customerMap.set(email, { email, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
    }

    const { data: memberships } = await supabase
      .from("memberships")
      .select("customer_email, customer_name")
      .not("customer_email", "is", null);

    for (const m of memberships || []) {
      const email = m.customer_email?.toLowerCase().trim();
      if (!email || customerMap.has(email)) continue;
      const parts = (m.customer_name || "").trim().split(/\s+/);
      customerMap.set(email, { email, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
    }

    const allContacts = Array.from(customerMap.values());
    console.log(`Found ${allContacts.length} unique contacts to sync`);

    // Use Mailchimp batch subscribe endpoint (up to 500 at a time)
    const CHUNK_SIZE = 500;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    for (let i = 0; i < allContacts.length; i += CHUNK_SIZE) {
      const chunk = allContacts.slice(i, i + CHUNK_SIZE);
      
      const members = chunk.map(contact => ({
        email_address: contact.email,
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: contact.firstName,
          LNAME: contact.lastName,
        },
      }));

      const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `apikey ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          members,
          update_existing: true,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        totalAdded += result.total_created || 0;
        totalUpdated += result.total_updated || 0;
        totalErrors += result.error_count || 0;
        if (result.errors?.length > 0 && errors.length < 10) {
          for (const e of result.errors.slice(0, 10 - errors.length)) {
            errors.push(`${e.email_address}: ${e.error}`);
          }
        }
        console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: created=${result.total_created}, updated=${result.total_updated}, errors=${result.error_count}`);
      } else {
        const errText = await res.text();
        console.error(`Mailchimp batch error: ${res.status} ${errText}`);
        totalErrors += chunk.length;
        if (errors.length < 10) errors.push(`Batch error: ${errText.substring(0, 200)}`);
      }
    }

    console.log(`Bulk sync complete: ${totalAdded} added, ${totalUpdated} updated, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        totalContacts: allContacts.length,
        added: totalAdded,
        updated: totalUpdated,
        errors: errors.length > 0 ? errors : undefined,
        errorCount: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Bulk Mailchimp sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
