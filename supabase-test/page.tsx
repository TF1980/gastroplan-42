"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Verbindung wird geprüft ...");

  useEffect(() => {
    async function testConnection() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setStatus("Fehler: Supabase-Variablen wurden nicht gefunden.");
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .limit(5);

      if (error) {
        setStatus(`Fehler: ${error.message}`);
        return;
      }

      setStatus(
        `Verbindung erfolgreich. Gefundene Unternehmen: ${data?.length ?? 0}`
      );
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>GastroPlan Supabase-Test</h1>
      <p>{status}</p>
    </main>
  );
}
