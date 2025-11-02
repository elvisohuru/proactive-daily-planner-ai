import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fovqyttvpdnvdvrfbboj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdnF5dHR2cGRudmR2cmZiYm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODQ2NDgsImV4cCI6MjA3NzY2MDY0OH0.pD18DyrGsiL-rlm5bxN_-h5P31rWXNzC17tl8clqxE0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
