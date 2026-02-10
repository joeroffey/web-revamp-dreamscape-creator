import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatReplyToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((para) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, replyText } = await req.json();

    if (!messageId || !replyText) {
      throw new Error("Message ID and reply text are required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the original message
    const { data: msg, error: fetchError } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (fetchError || !msg) {
      throw new Error("Message not found");
    }

    // Update the message record
    const { error: updateError } = await supabaseAdmin
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

    const logoUrl = "https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/hub_logo.png";
    const formattedReply = formatReplyToHtml(replyText);

    // Send branded email
    const emailResponse = await resend.emails.send({
      from: "Revitalise Hub <info@revitalisehub.co.uk>",
      to: [msg.email],
      subject: `Re: Your message to Revitalise Hub`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f0eb; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #2d5c3b; padding: 30px; text-align: center;">
      <img src="${logoUrl}" alt="Revitalise Hub" style="max-width: 180px; height: auto;" />
    </div>

    <!-- Body -->
    <div style="padding: 40px 30px;">
      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Hi ${msg.name},</p>
      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Thank you for getting in touch. Here is our response to your message:</p>
      
      <div style="background-color: #f8f6f3; border-left: 4px solid #2d5c3b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #333; font-size: 15px;">
        ${formattedReply}
      </div>

      <p style="margin: 20px 0 0 0; color: #333; font-size: 16px;">If you have any further questions, please don't hesitate to get in touch.</p>
      <p style="margin: 16px 0 0 0; color: #333; font-size: 16px;">Warm regards,<br><strong>The Revitalise Hub Team</strong></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #2d5c3b; padding: 30px; text-align: center; color: #ffffff;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Revitalise Hub</p>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #d4e4d9;">Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY</p>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #d4e4d9;">01590 698 691 | 0754 696 5111</p>
      <p style="margin: 0; font-size: 13px; color: #d4e4d9;">info@revitalisehub.co.uk</p>
    </div>
  </div>
</body>
</html>
      `,
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
