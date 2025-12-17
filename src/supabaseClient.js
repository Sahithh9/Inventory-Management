
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://liqxhidbaejfqkuqxywh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXhoaWRiYWVqZnFrdXF4eXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDYyMDAsImV4cCI6MjA4MTUyMjIwMH0.gupy1sSpQ5SZjde12nRlahNeHHisJAdmf6vCRidiSP4';

export const supabase = createClient(supabaseUrl, supabaseKey);
