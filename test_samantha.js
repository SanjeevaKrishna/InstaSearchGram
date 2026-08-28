const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kmamqlbtiqmfsngovniw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYW1xbGJ0aXFtZnNuZ292bml3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjM5NywiZXhwIjoyMDk0MDAyMzk3fQ.lJvcaTRDJdB7ptMduso084CVKtiiqn4-W7PgVhHqkKA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('most_followed')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    console.error('Error fetching:', error)
    return
  }
  console.log('Columns on most_followed:', Object.keys(data))
}

run()
