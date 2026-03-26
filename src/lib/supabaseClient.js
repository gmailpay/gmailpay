import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "gmailpay-auth"
    }
  }
)

// Warm up Supabase on app load
supabase.from("app_settings").select("setting_key").limit(1).then(() => {
  console.log("Supabase warmed up");
}).catch(() => {});
