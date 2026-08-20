/**
 * Extracts the real error message from a supabase.functions.invoke() failure.
 * By default the SDK throws a generic "Edge Function returned a non-2xx status
 * code" and hides the JSON body, which makes user-facing errors useless.
 */
export const getFunctionErrorMessage = async (
  error: unknown,
  fallback = "Please try again."
): Promise<string> => {
  const anyErr = error as any;
  try {
    const res: Response | undefined = anyErr?.context;
    if (res && typeof res.json === "function") {
      const body = await res.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    }
  } catch {
    // ignore body parse failures
  }
  const msg = anyErr?.message as string | undefined;
  if (msg && !msg.includes("non-2xx")) return msg;
  return fallback;
};
