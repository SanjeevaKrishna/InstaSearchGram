// Setup verification for Spialr Laptop Live Follower Worker
// Run: node laptop-server/setup-db.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kmamqlbtiqmfsngovniw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYW1xbGJ0aXFtZnNuZ292bml3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjM5NywiZXhwIjoyMDk0MDAyMzk3fQ.lJvcaTRDJdB7ptMduso084CVKtiiqn4-W7PgVhHqkKA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('Checking database readiness for Live Follower Worker...\n')

const { data, error } = await supabase.from('live_settings').select('*').eq('id', 99).maybeSingle()

if (error) {
  console.error('❌ Error checking live_settings:', error.message)
} else {
  console.log('✅ live_settings (id: 99) sync channel is READY!')
  console.log('State:', data?.instagram_session_id ? JSON.parse(data.instagram_session_id) : 'empty')
  console.log('\nAll set! You can start the worker anytime with:')
  console.log('  node laptop-server/run.mjs\n')
}
