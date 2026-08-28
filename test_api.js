const handler = require('./pages/api/celebrities/refresh_live_followers').default

// Mock req and res
const req = {
  query: {
    id: '4580227f-94d3-4638-b7eb-300438ad49cf' // Samantha's most_followed id is different? 
    // Wait, let's query Samantha's ID in most_followed table first!
  }
}

const res = {
  status: function(code) {
    console.log('HTTP Status:', code)
    return this
  },
  json: function(data) {
    console.log('JSON Response:', data)
    return this
  }
}

async function run() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = 'https://kmamqlbtiqmfsngovniw.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYW1xbGJ0aXFtZnNuZ292bml3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjM5NywiZXhwIjoyMDk0MDAyMzk3fQ.lJvcaTRDJdB7ptMduso084CVKtiiqn4-W7PgVhHqkKA'
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: sam } = await supabase
    .from('most_followed')
    .select('id, name, instagram_handle, followers_count')
    .ilike('name', '%samantha%')
    .single()

  console.log('Samantha in most_followed:', sam)

  if (sam) {
    req.query.id = sam.id
    console.log('Running handler with ID:', sam.id)
    await handler(req, res)
  }
}

run()
