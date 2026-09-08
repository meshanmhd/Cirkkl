import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'teams' });
  console.log('teams policies:', data, error);
  
  // if rpc fails, we can query pg_policies directly
  const { data: pData, error: pErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'teams');
  console.log('pg_policies:', pData, pErr);
}

main().catch(console.error);
