/**
 * Fire-and-forget helper so other edge functions can notify the
 * conditional email engine that something happened.
 * Never throws — a failed notification must not break a payment or booking flow.
 */
export async function fireConditionalEmailEvent(event: {
  type: string;
  email: string;
  name?: string | null;
  user_id?: string | null;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey || !event.email) return;

    const res = await fetch(`${url}/functions/v1/conditional-emails-evaluate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "event", event }),
    });

    if (!res.ok) {
      console.error(`Conditional email event "${event.type}" failed [${res.status}]:`, await res.text());
    } else {
      await res.text();
    }
  } catch (err) {
    console.error(`Conditional email event "${event.type}" error:`, err);
  }
}
