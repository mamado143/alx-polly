"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}
