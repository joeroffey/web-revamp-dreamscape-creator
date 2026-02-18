import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatReplyToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((para) => `<p style="font-size: 15px; color: #52331F; line-height: 1.7; margin: 0 0 16px 0;">${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);
    const { messageId, replyText } = await req.json();

    if (!messageId || !replyText) {
      throw new Error("Message ID and reply text are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the original message
    const { data: msg, error: fetchError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (fetchError || !msg) {
      throw new Error("Message not found");
    }

    // Update the message record
    const { error: updateError } = await supabase
      .from("contact_messages")
      .update({
        status: "replied",
        admin_reply: replyText,
        replied_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (updateError) {
      throw new Error("Failed to update message");
    }

    const logoUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/data101/hub_logo.png`;
    const formattedReply = formatReplyToHtml(replyText);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #CCBBA8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" style="max-width: 480px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(82, 51, 31, 0.12);">
                  <tr>
                    <td style="padding: 40px 32px;">
                      <!-- Header Logo -->
                      <div style="text-align: center; margin-bottom: 32px;">
                        <img src="${logoUrl}" alt="Revitalise Hub" style="max-width: 180px; height: auto;" />
                      </div>

                      <!-- Main Content - exactly what the admin typed -->
                      ${formattedReply}

                      <!-- Divider -->
                      <div style="border-top: 1px solid #e8e0d8; margin: 28px 0;"></div>

                      <!-- Location & Contact -->
                      <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">Find Us</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0;">
                          📍 Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY
                        </p>
                      </div>

                      <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">Contact Us</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0;">
                          📧 <a href="mailto:info@revitalisehub.co.uk" style="color: #967B5E; text-decoration: none;">info@revitalisehub.co.uk</a><br>
                          🌐 <a href="https://revitalisehub.co.uk" style="color: #967B5E; text-decoration: none;">revitalisehub.co.uk</a>
                        </p>
                      </div>

                      <!-- Divider -->
                      <div style="border-top: 1px solid #e8e0d8; margin: 24px 0;"></div>

                      <!-- Footer -->
                      <p style="font-size: 12px; color: #967B5E; text-align: center; line-height: 1.6; margin: 0;">
                        © Revitalise Hub | Cold Water & Contrast Therapy
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Revitalise Hub <info@revitalisehub.co.uk>",
      to: [msg.email],
      subject: `Re: Your message to Revitalise Hub`,
      html: emailHtml,
    });

    console.log("Reply email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
