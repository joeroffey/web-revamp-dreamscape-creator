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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2d5a4a; text-align: center; margin-bottom: 10px;">🎁 You've Received a Gift Card!</h1>
            <p style="text-align: center; color: #666; font-size: 18px;">from Revitalise Hub</p>
            
            <div style="text-align: center; padding: 30px 0;">
              <p style="font-size: 16px; color: #333;">Hi ${recipientName},</p>
              <p style="font-size: 16px; color: #333;">${giftCard.purchaser_name} has sent you a gift card worth</p>
              <p style="font-size: 48px; font-weight: bold; color: #2d5a4a; margin: 20px 0;">£${amountInPounds}</p>
            </div>
            
            ${personalMessage}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Your gift card code:</p>
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #2d5a4a; background: #f0f7f4; padding: 15px 30px; border-radius: 8px; display: inline-block;">${giftCard.gift_code}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redeemUrl}" style="display: inline-block; background: #2d5a4a; color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: 500;">Redeem Your Gift Card</a>
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #999; margin-top: 30px;">
              Click the button above to redeem your gift card. You'll need to sign in or create an account to add the credit to your wallet.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="text-align: center; font-size: 12px; color: #999;">
              This gift card is valid for 1 year from redemption.<br>
              © Revitalise Hub | Cold Water Therapy & Infrared Sauna
            </p>
          </div>
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
