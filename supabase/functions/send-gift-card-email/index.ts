import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftCardEmailRequest {
  giftCardId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { giftCardId }: GiftCardEmailRequest = await req.json();

    if (!giftCardId) {
      throw new Error("Missing giftCardId");
    }

    // Get gift card details
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', giftCardId)
      .single();

    if (giftCardError || !giftCard) {
      throw new Error("Gift card not found");
    }

    // Determine recipient email - if no recipient specified, send to purchaser
    const recipientEmail = giftCard.recipient_email || giftCard.purchaser_email;
    const recipientName = giftCard.recipient_name || giftCard.purchaser_name;
    
    // Convert amount from pence to pounds
    const amountInPounds = (giftCard.amount / 100).toFixed(2);
    
    // Create redemption URL with gift code
    const baseUrl = Deno.env.get("SITE_URL") || "https://id-preview--43cef0a9-9833-4433-9a09-ceddae85b529.lovable.app";
    const redeemUrl = `${baseUrl}/redeem-gift-card?code=${giftCard.gift_code}`;

    // Build email content
    const personalMessage = giftCard.message 
      ? `<p style="font-style: italic; color: #666; padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0;">"${giftCard.message}"</p>` 
      : '';

    // Build personal message with branded styling
    const styledPersonalMessage = giftCard.message 
      ? `<div style="padding: 20px; background: #f5f0eb; border-left: 4px solid #967B5E; border-radius: 4px; margin: 24px 0;">
           <p style="font-style: italic; color: #52331F; margin: 0; font-size: 15px; line-height: 1.6;">"${giftCard.message}"</p>
         </div>` 
      : '';

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
                      <!-- Header -->
                      <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 22px; font-weight: 600; letter-spacing: 3px; color: #52331F; margin: 0 0 8px 0;">REVITALISE HUB</h1>
                        <div style="width: 60px; height: 2px; background: #967B5E; margin: 0 auto;"></div>
                      </div>

                      <!-- Gift Icon -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #52331F 0%, #967B5E 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">🎁</div>
                      </div>

                      <!-- Main Content -->
                      <h2 style="font-size: 24px; font-weight: 500; color: #52331F; text-align: center; margin: 0 0 16px 0;">You've Received a Gift Card!</h2>
                      
                      <p style="font-size: 15px; color: #967B5E; text-align: center; margin: 0 0 8px 0;">Hi ${recipientName},</p>
                      <p style="font-size: 15px; color: #52331F; text-align: center; margin: 0 0 24px 0;">${giftCard.purchaser_name} has sent you a gift card worth</p>
                      
                      <!-- Amount Display -->
                      <div style="text-align: center; margin: 24px 0;">
                        <p style="font-size: 48px; font-weight: 700; color: #52331F; margin: 0; letter-spacing: -1px;">£${amountInPounds}</p>
                      </div>

                      ${styledPersonalMessage}

                      <!-- Gift Code -->
                      <div style="text-align: center; margin: 28px 0;">
                        <p style="font-size: 13px; color: #967B5E; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Your Gift Card Code</p>
                        <div style="background: #f5f0eb; padding: 16px 24px; border-radius: 8px; display: inline-block;">
                          <p style="font-size: 20px; font-weight: 600; letter-spacing: 4px; color: #52331F; margin: 0; font-family: 'Courier New', monospace;">${giftCard.gift_code}</p>
                        </div>
                      </div>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${redeemUrl}" style="display: inline-block; background: #52331F; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 30px; font-size: 15px; font-weight: 500; letter-spacing: 0.5px;">Redeem Your Gift Card</a>
                      </div>

                      <p style="font-size: 13px; color: #967B5E; text-align: center; line-height: 1.6; margin: 0;">
                        Click the button above to redeem your gift card. You'll need to sign in or create an account to add the credit to your wallet.
                      </p>

                      <!-- Divider -->
                      <div style="border-top: 1px solid #e8e0d8; margin: 32px 0;"></div>

                      <!-- Footer -->
                      <p style="font-size: 12px; color: #967B5E; text-align: center; line-height: 1.6; margin: 0;">
                        This gift card is valid for 1 year from redemption.<br>
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

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Revitalise Hub <info@revitalisehub.co.uk>",
      to: [recipientEmail],
      subject: `🎁 You've received a £${amountInPounds} Revitalise Hub Gift Card!`,
      html: emailHtml,
    });

    console.log("Gift card email sent successfully:", emailResponse);

    // Update gift card to mark email as sent
    await supabase
      .from('gift_cards')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', giftCardId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error sending gift card email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
