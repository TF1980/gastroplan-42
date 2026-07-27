"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Verbindung wird geprüft ...");

  useEffect(() => {
    async function testConnection() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setStatus("❌ Supabase-Variablen wurden nicht gefunden.");
        return;
      }

      const { error } = await supabase
        .from("companies")
        .select("*")
        .limit(1);

      if (error) {
        setStatus(`❌ ${error.message}`);
      } else {
        setStatus("✅ Verbindung zu Supabase erfolgreich!");
      }
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>GastroPlan – Supabase Test</h1>
      <p>{status}</p>
    </main>
  );
}
