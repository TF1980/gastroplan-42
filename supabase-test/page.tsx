"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";

type Location = {
  id: string;
  name: string;
  city: string | null
