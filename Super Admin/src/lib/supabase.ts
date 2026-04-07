import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaoutfnnnxdqhhzajwpc.supabase.co';
const supabaseAnonKey = 'sb_publishable_4chgF9SG3Tel7Ezjp84-Uw_HvhNaFRE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
