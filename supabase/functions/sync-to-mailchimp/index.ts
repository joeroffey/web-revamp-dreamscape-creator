import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto as stdCrypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const listId = Deno.env.get("MAILCHIMP_LIST_ID");
    const serverPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");

    if (!apiKey || !listId || !serverPrefix) {
      console.error("Mailchimp configuration missing");
      throw new Error("Mailchimp not configured");
    }

    // MD5 hash of lowercase email (Mailchimp requirement)
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const subscriberHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: firstName || "",
          LNAME: lastName || "",
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Mailchimp API error:", response.status, errorBody);
      throw new Error(`Mailchimp API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Mailchimp sync successful for:", email, "Status:", result.status);

    return new Response(
      JSON.stringify({ success: true, status: result.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Mailchimp sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
