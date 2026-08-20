import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function isServiceRoleBearer(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "").trim();
  return !!bearer && bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Returns null when authorized, otherwise an error { status, message }.
 * Service-role bearer is always allowed; otherwise the caller must be an admin user.
 */
export async function requireAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ status: number; message: string } | null> {
  if (isServiceRoleBearer(req)) return null;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return { status: 401, message: "Unauthorized" };

  const bearer = authHeader.replace("Bearer ", "").trim();
  const { data, error } = await supabase.auth.getUser(bearer);
  if (error || !data?.user) return { status: 401, message: "Invalid authentication" };

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) return { status: 403, message: "Admin access required" };
  return null;
}
