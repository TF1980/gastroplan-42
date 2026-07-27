"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";

type Location = {
  id: string;
  name: string;
  city: string | null
useEffect(() => {
  async function loadData() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus("❌ Keine Verbindung zu Supabase");
      return;
    }

    setStatus("✅ Verbindung zu Supabase erfolgreich!");

    const { data: locations } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    setLocations(locations ?? []);

    const { data: employees } = await supabase
      .from("employees")
      .select(`
        id,
        first_name,
        position,
        weekly_hours,
        locations(name)
      `)
      .order("first_name");

    setEmployees((employees as Employee[]) ?? []);
  }

  loadData();
}, []);
