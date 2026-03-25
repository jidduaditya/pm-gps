import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://avsjimrirjmxdeuaoveo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c2ppbXJpcmpteGRldWFvdmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjY5MzgsImV4cCI6MjA5MDAwMjkzOH0.p6I7SYH2T202AGOm6-nNpM04umOYM1hL1B3DRBVxkFM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
