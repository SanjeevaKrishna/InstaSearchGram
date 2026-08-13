const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  try {
    const { data, error } = await supabase
      .from('most_followed')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Error querying table:", error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      const row = data[0];
      const hasColumn = 'instagram_handle' in row;
      console.log("SUCCESS");
      console.log("HAS_COLUMN:", hasColumn);
      console.log("SAMPLE_ROW:", JSON.stringify(row, null, 2));
    } else {
      const { data: colData, error: colErr } = await supabase
        .from('most_followed')
        .select('instagram_handle')
        .limit(1);

      if (colErr) {
        console.log("SUCCESS");
        console.log("HAS_COLUMN: false");
      } else {
        console.log("SUCCESS");
        console.log("HAS_COLUMN: true");
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

checkColumn();
