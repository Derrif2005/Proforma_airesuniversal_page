// js/supabase.js
const SUPABASE_URL = "https://lkvtucekkmucwfusrgbe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zViqQ0_LAg75N07OHtuwnw_oVJ20fFK";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
