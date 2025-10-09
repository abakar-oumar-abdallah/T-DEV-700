const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont manquantes.');
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('✅ Supabase client initialized.');

module.exports = supabase;