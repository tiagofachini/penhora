import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsvxxhvfmgzopkfyhuac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzdnh4aHZmbWd6b3BrZnlodWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODg3NzYsImV4cCI6MjA3ODU2NDc3Nn0.jXmdbh3FeS7oSy1Wl9SmWDcWE31AsRlpwi9eeOIt69o';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
