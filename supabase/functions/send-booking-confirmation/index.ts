import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingId?: string;
  // Or pass details directly for test emails
  customerName?: string;
  customerEmail?: string;
  sessionDate?: string;
  sessionTime?: string;
  guestCount?: number;
  bookingType?: string;
  specialRequests?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
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

    const body: BookingConfirmationRequest = await req.json();
    
    let customerName: string;
    let customerEmail: string;
    let sessionDate: string;
    let sessionTime: string;
    let guestCount: number;
    let bookingType: string;
    let specialRequests: string | null;

    if (body.bookingId) {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', body.bookingId)
        .single();
      if (error || !booking) throw new Error("Booking not found");
      
      customerName = booking.customer_name;
      customerEmail = booking.customer_email;
      sessionDate = booking.session_date;
      sessionTime = booking.session_time;
      guestCount = booking.guest_count;
      bookingType = booking.booking_type;
      specialRequests = booking.special_requests;
    } else {
      customerName = body.customerName || 'Guest';
      customerEmail = body.customerEmail || '';
      sessionDate = body.sessionDate || new Date().toISOString().split('T')[0];
      sessionTime = body.sessionTime || '10:00';
      guestCount = body.guestCount || 1;
      bookingType = body.bookingType || 'communal';
      specialRequests = body.specialRequests || null;
    }

    if (!customerEmail) throw new Error("No customer email");

    const formattedDate = formatDate(sessionDate);
    const formattedTime = formatTime(sessionTime);
    const sessionTypeLabel = bookingType === 'private' ? 'Private Session (Exclusive)' : 'Communal Session (Shared)';
    const guestLabel = guestCount === 1 ? '1 person' : `${guestCount} people`;

    const specialRequestsBlock = specialRequests 
      ? `<div style="padding: 16px; background: #f5f0eb; border-left: 4px solid #967B5E; border-radius: 4px; margin: 20px 0;">
           <p style="font-size: 13px; color: #967B5E; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Special Requests</p>
           <p style="font-size: 14px; color: #52331F; margin: 0;">${specialRequests}</p>
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

                      <!-- Icon -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #52331F 0%, #967B5E 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">✅</div>
                      </div>

                      <!-- Main Content -->
                      <h2 style="font-size: 24px; font-weight: 500; color: #52331F; text-align: center; margin: 0 0 8px 0;">Booking Confirmed!</h2>
                      <p style="font-size: 15px; color: #967B5E; text-align: center; margin: 0 0 28px 0;">Hi ${customerName}, your session is all booked in.</p>

                      <!-- Booking Details Card -->
                      <div style="background: #f5f0eb; border-radius: 10px; padding: 24px; margin: 0 0 24px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Time</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${formattedTime}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Session Type</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${sessionTypeLabel}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e8e0d8;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Guests</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">${guestLabel}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="font-size: 13px; color: #967B5E; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
                              <p style="font-size: 16px; color: #52331F; margin: 4px 0 0 0; font-weight: 500;">60 minutes</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      ${specialRequestsBlock}

                      <!-- What to Bring -->
                      <div style="margin: 24px 0;">
                        <h3 style="font-size: 15px; color: #52331F; margin: 0 0 12px 0; font-weight: 600;">What to Bring</h3>
                        <p style="font-size: 14px; color: #52331F; line-height: 1.7; margin: 0;">
                          🩱 Swimwear<br>
                          🧖 Towel (or we have towels available)<br>
                          💧 Water bottle<br>
                          🔒 Padlock for locker (optional)
                        </p>
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
                        Need to amend your booking? Get in touch with us<br>at info@revitalisehub.co.uk and we'll be happy to help.
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
      subject: `✅ Booking Confirmed — ${formattedDate} at ${formattedTime}`,
      html: emailHtml,
    });

    console.log("Booking confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
