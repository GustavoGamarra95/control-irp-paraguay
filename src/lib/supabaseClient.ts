interface ImportMetaEnv {
	VITE_SUPABASE_URL: string;
	VITE_SUPABASE_KEY: string;
	VITE_SUPABASE_PROJECT_ID?: string;
	VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
	env: ImportMetaEnv;
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
