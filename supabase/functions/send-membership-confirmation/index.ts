import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MembershipConfirmationRequest {
  membershipId?: string;
  // Or pass details directly for test emails
  customerName?: string;
  customerEmail?: string;
  membershipType?: string;
  sessionsPerMonth?: number;
  startDate?: string;
  endDate?: string;
  isAutoRenew?: boolean;
  priceAmount?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getMembershipLabel(type: string, sessions: number): string {
  if (type === 'unlimited') return 'Unlimited Membership';
  return `${sessions} Sessions Per Month`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: MembershipConfirmationRequest = await req.json();

    let customerName: string;
    let customerEmail: string;
    let membershipType: string;
    let sessionsPerMonth: number;
    let startDate: string;
    let endDate: string;
    let isAutoRenew: boolean;
    let priceAmount: number;

    if (body.membershipId) {
      const { data: membership, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', body.membershipId)
        .single();
      if (error || !membership) throw new Error("Membership not found");

      customerName = membership.customer_name || 'Member';
      customerEmail = membership.customer_email || '';
      membershipType = membership.membership_type;
      sessionsPerMonth = membership.sessions_per_week; // column stores monthly allocation
      startDate = membership.start_date || new Date().toISOString().split('T')[0];
      endDate = membership.end_date || '';
      isAutoRenew = membership.is_auto_renew || false;
      priceAmount = membership.price_amount || 0;
    } else {
      customerName = body.customerName || 'Member';
      customerEmail = body.customerEmail || '';
      membershipType = body.membershipType || '4_sessions_month';
      sessionsPerMonth = body.sessionsPerMonth || 4;
      startDate = body.startDate || new Date().toISOString().split('T')[0];
      endDate = body.endDate || '';
      isAutoRenew = body.isAutoRenew ?? true;
      priceAmount = body.priceAmount || 4800;
    }

    if (!customerEmail) throw new Error("No customer email");

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = endDate ? formatDate(endDate) : '';
    const membershipLabel = getMembershipLabel(membershipType, sessionsPerMonth);
    const priceFormatted = `£${(priceAmount / 100).toFixed(2)}`;
    const renewalInfo = isAutoRenew
      ? 'Your membership will automatically renew each month. You can cancel or manage your subscription anytime from your dashboard.'
      : 'Your membership is a one-time purchase for 30 days. To continue after this period, you can purchase a new membership from our website.';

    const sessionsInfo = membershipType === 'unlimited'
      ? 'You have <strong>unlimited sessions</strong> during your membership period. Book as many as you like!'
      : `You have <strong>${sessionsPerMonth} sessions</strong> to use each month. Sessions reset at the start of each billing cycle.`;

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
                        <img src="${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/data101/hub_logo.png" alt="Revitalise Hub" style="max-width: 180px; height: auto;" />
                      </div>

                      <!-- Icon -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #52331F 0%, #967B5E 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">🎉</div>
                      </div>

                      <!-- Main Content -->
                      <h2 style="font-size: 24px; font-weight: 500; color: #52331F; text-align: center; margin: 0 0 8px 0;">Welcome to the Club!</h2>
                      <p style="font-size: 15px; color: #967B5E; text-align: center; margin: 0 0 28px 0;">Hi ${customerName}, your membership is now active.</p>

                      <!-- Membership Details Card -->
                      <div style="background: #f5f0eb; border-radius: 10px; padding: 24px; margin: 0 0 24px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Membership Plan</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${membershipLabel}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Price</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${priceFormatted} / month</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Start Date</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${formattedStartDate}</p>
                            </td>
                          </tr>
                          ${formattedEndDate ? `<tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Current Period Ends</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${formattedEndDate}</p>
                            </td>
                          </tr>` : ''}
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Auto-Renewal</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${isAutoRenew ? 'Yes — Renews Monthly' : 'No — One-Time Purchase'}</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- How It Works -->
                      <div style="margin: 24px 0;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">How Your Membership Works</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0 0 12px 0;">
                          ${sessionsInfo}
                        </p>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0 0 12px 0;">
                          To book a session, simply log in to your account on our website and choose your preferred date and time. Your member sessions will be used automatically — no need to enter any payment details.
                        </p>
                      </div>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 28px 0;">
                        <a href="https://revitalisehub.co.uk/booking" style="display: inline-block; background: #52331F; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 30px; font-size: 15px; font-weight: 500; letter-spacing: 0.5px;">Book Your First Session</a>
                      </div>

                      <!-- Renewal Info -->
                      <div style="padding: 16px; background: #f5f0eb; border-left: 4px solid #967B5E; border-radius: 4px; margin: 24px 0;">
                        <p style="font-size: 13px; color: #967B5E; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Subscription Management</p>
                        <p style="font-size: 14px; color: #52331F; margin: 0; line-height: 1.6;">${renewalInfo}</p>
                      </div>

                      <!-- Divider -->
                      <div style="border-top: 1px solid #e8e0d8; margin: 28px 0;"></div>

                      <!-- Location & Contact -->
                      <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">Find Us</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0;">
                          📍 Unit 7, Ensign Yard, 670 Ampress Lane,<br>
                          &nbsp;&nbsp;&nbsp;&nbsp; Lymington SO41 8QY
                        </p>
                      </div>

                      <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">Contact Us</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0;">
                          📧 <a href="mailto:info@revitalisehub.co.uk" style="color: #967B5E; text-decoration: none;">info@revitalisehub.co.uk</a><br>
                          🌐 <a href="https://revitalisehub.co.uk" style="color: #967B5E; text-decoration: none;">revitalisehub.co.uk</a>
                        </p>
                      </div>

                      <p style="font-size: 13px; color: #967B5E; text-align: center; line-height: 1.6; margin: 0;">
                        Need help with your membership? Just email us<br>at info@revitalisehub.co.uk — we're here to help.
                      </p>

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
      to: [customerEmail],
      subject: `🎉 Welcome to Revitalise Hub — ${membershipLabel}`,
      html: emailHtml,
    });

    console.log("Membership confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error sending membership confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
