const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found.");
  process.exit(1);
}

const dotenvContent = fs.readFileSync(envPath, 'utf8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const formatCount = (count) => {
  if (!count) return '';
  if (count >= 1000000000) {
    return `${(Math.floor(count / 100000000) / 10).toString().replace(/\.0$/, '')}B`;
  } else if (count >= 1000000) {
    return `${(Math.floor(count / 100000) / 10).toString().replace(/\.0$/, '')}M`;
  } else if (count >= 1000) {
    return `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, '')}K`;
  } else {
    return count.toString();
  }
};

async function main() {
  console.log("Fetching profiles from most_followed table...");
  let allProfiles = [];
  let from = 0;
  let to = 999;
  
  while (true) {
    const { data, error } = await supabase
      .from('most_followed')
      .select('*')
      .range(from, to);
      
    if (error) {
      console.error("Fetch error:", error);
      process.exit(1);
    }
    allProfiles = allProfiles.concat(data || []);
    if (!data || data.length < 1000) break;
    from += 1000;
    to += 1000;
  }
  
  console.log(`Found ${allProfiles.length} profiles. Checking for formatting updates...`);
  
  const updates = [];
  for (const profile of allProfiles) {
    if (!profile.followers_count) continue;
    const newText = formatCount(profile.followers_count);
    if (profile.followers_text !== newText) {
      console.log(`Updating ${profile.name}: ${profile.followers_text} -> ${newText} (Numeric: ${profile.followers_count})`);
      updates.push({
        id: profile.id,
        followers_text: newText
      });
    }
  }
  
  if (updates.length === 0) {
    console.log("All profiles are already up to date with the truncated format.");
    return;
  }
  
  console.log(`Performing ${updates.length} updates...`);
  
  // Update in batches of 100
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);
    // We only update the followers_text column
    for (const item of batch) {
      const { error } = await supabase
        .from('most_followed')
        .update({ followers_text: item.followers_text })
        .eq('id', item.id);
        
      if (error) {
        console.error(`Error updating profile ID ${item.id}:`, error);
      }
    }
    console.log(`Updated batch ${i} to ${Math.min(i + 100, updates.length)}`);
  }
  
  console.log("Finished updating followers_text in database!");
}

main();
