const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kmamqlbtiqmfsngovniw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYW1xbGJ0aXFtZnNuZ292bml3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjM5NywiZXhwIjoyMDk0MDAyMzk3fQ.lJvcaTRDJdB7ptMduso084CVKtiiqn4-W7PgVhHqkKA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const id = '6909b44e-94bf-402f-8566-0591ba7a1e4d'
  
  // 1. Fetch
  const { data: profile, error: fError } = await supabase
    .from('most_followed')
    .select('*')
    .eq('id', id)
    .single()
    
  console.log('Fetch error:', fError)
  console.log('Fetched profile:', profile ? { id: profile.id, name: profile.name, followers_count: profile.followers_count } : null)

  if (!profile) return

  // 2. Try update without .single()
  const { data: updateData, error: uError } = await supabase
    .from('most_followed')
    .update({
      followers_count: 38171052
    })
    .eq('id', id)
    .select('*')

  console.log('Update error:', uError)
  console.log('Update data:', updateData)
}

run()
