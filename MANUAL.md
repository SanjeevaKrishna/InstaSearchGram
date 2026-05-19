# 📖 InstaSearch — Complete Setup & Update Manual
### Written for non-coders. Every step is explained clearly.

---

## 🗺️ TABLE OF CONTENTS
1. What You Need (Accounts)
2. Step 1 — Set Up Supabase (Your Database)
3. Step 2 — Set Up GitHub (Your Code Storage)
4. Step 3 — Set Up Vercel (Your Live Website)
5. Step 4 — Add Your Secret Admin Password
6. How to Use the Admin Panel
7. How to Add a Celebrity
8. How to Add a Post / Reel
9. How to Update the Website Next Time
10. Troubleshooting

---

## 📋 WHAT YOU NEED

Create free accounts on these 3 websites before starting:
- **Supabase** → https://supabase.com (your database)
- **GitHub** → https://github.com (stores your code)
- **Vercel** → https://vercel.com (runs your live website)

---

## STEP 1 — SET UP SUPABASE (Database)

1. Go to https://supabase.com and sign up (free)
2. Click **"New Project"**
3. Give it any name like `instasearch`
4. Set a strong database password (save it somewhere safe)
5. Choose a region close to India (e.g. Singapore)
6. Wait 2 minutes for it to be created

### Create Your Tables (Database Structure):
7. In the left sidebar, click **"SQL Editor"**
8. Click **"New Query"**
9. Open the file `supabase-schema.sql` from the project folder
10. Copy ALL the text inside it
11. Paste it into the SQL Editor on Supabase
12. Click the **"Run"** button (green button)
13. You should see "Success" — your database is ready!

### Get Your API Keys:
14. In the left sidebar, click **"Settings"** (gear icon)
15. Click **"API"**
16. You will see:
    - **Project URL** → copy this (looks like: https://abcxyz.supabase.co)
    - **anon public key** → copy this (long text starting with "eyJ...")
    - **service_role key** → copy this (another long text — keep this SECRET!)

Save all 3 somewhere safe. You'll need them in Step 4.

---

## STEP 2 — SET UP GITHUB

1. Go to https://github.com and sign up or login
2. Click the **"+"** button (top right) → **"New repository"**
3. Name it `insta-search`
4. Keep it **Public** (required for free Vercel)
5. Click **"Create repository"**

### Upload Your Files:
6. On the next page, click **"uploading an existing file"**
7. Drag and drop ALL the project files/folders from the `insta-search` folder on your computer
   - Upload everything EXCEPT `node_modules` folder (don't upload that)
8. Click **"Commit changes"**

Your code is now on GitHub! ✅

---

## STEP 3 — SET UP VERCEL (Live Website)

1. Go to https://vercel.com and sign up using your GitHub account
2. Click **"Add New..."** → **"Project"**
3. Find your `insta-search` repository and click **"Import"**
4. Keep all default settings
5. Click **"Deploy"**
6. Wait 2-3 minutes — Vercel will try to build (it will fail at first, that's ok)

---

## STEP 4 — ADD YOUR SECRET ADMIN PASSWORD

This is CRITICAL. Without this, admin panel won't work.

1. In Vercel, click on your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the left menu
4. Add these one by one (click "Add" for each):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `ADMIN_SECRET_CODE` | Make up a strong password — only YOU know this! |

5. After adding all 4, go to **"Deployments"** tab
6. Click the **three dots** on the latest deployment → **"Redeploy"**
7. Wait for it to finish — your site is now LIVE! 🎉

Your live website URL will look like: `https://insta-search-abc.vercel.app`

---

## 🔐 HOW TO USE THE ADMIN PANEL

Your admin panel is at a **secret URL** — don't share it!

**URL:** `https://your-site.vercel.app/admin`

1. Go to that URL
2. Enter the `ADMIN_SECRET_CODE` you set in Step 4
3. You're in! The admin panel has two sections:
   - **👤 Celebrities** — Add/edit/delete celebrity profiles
   - **🎬 Posts & Reels** — Add/edit/delete post links

**Important:** The admin panel never shows your secret code to anyone. It's stored safely on Vercel's servers.

---

## HOW TO ADD A CELEBRITY

1. Open the Admin Panel
2. Click **"Celebrities"** tab
3. Click **"+ Add Celebrity"**
4. Fill in the form:
   - **Full Name** → e.g. `Virat Kohli` (required)
   - **Instagram Handle** → e.g. `virat.kohli` (without the @)
   - **Followers Count** → type the number, e.g. `270000000` (for 27 Cr)
   - **Total Posts** → how many posts they have on Instagram
   - **Photo URL** → optional, paste a direct image link
   - **Show on Homepage** → tick this to show on the front page
5. Click **"Add Celebrity"**

✅ Done! The celebrity now appears in search results.

---

## HOW TO ADD A POST / REEL

1. Open the Admin Panel
2. Click **"Posts & Reels"** tab
3. Click **"+ Add Post"**
4. Fill in the form:
   - **Celebrity** → select from the dropdown
   - **Instagram Post URL** → paste the full Instagram link  
     (e.g. `https://www.instagram.com/reel/ABC123/`)
   - **Type** → select Reel, Post (Photo), or Video
   - **Post Date** → pick the date the post was published
   - **Caption** → paste the caption or write a short description
   - **Tags** → type comma-separated keywords  
     (e.g. `cricket, ipl, boundary, celebration, rcb`)
   - **Checkboxes** → tick if this is the Most Liked / Most Commented / Most Viewed / First Post
5. Click **"Add Post"**

✅ Done! Users can now search for and find this post.

### 💡 TIPS FOR TAGS:
- Use simple lowercase words
- Think: what would a user search to find this post?
- Examples: `wedding, fashion, dance, birthday, interview, match, century, award`
- You can add up to 10 tags per post (comma separated)

---

## 🔄 HOW TO UPDATE THE WEBSITE NEXT TIME

### To add new posts/celebrities:
→ Just open the Admin Panel and add them. No code needed! ✅

### To change website design or text:
1. Open the relevant file in GitHub (in your browser)
2. Click the **pencil icon** (Edit)
3. Make your changes
4. Click **"Commit changes"**
5. Vercel will automatically rebuild and update your site in ~2 minutes

### Which file controls what:
| File | What it controls |
|------|-----------------|
| `pages/index.js` | Homepage (search bar, hero text) |
| `pages/celebrity/[slug].js` | Celebrity page (filters, post grid) |
| `pages/about.js` | About page text |
| `pages/privacy.js` | Privacy policy text |
| `styles/globals.css` | Colors, fonts, overall look |
| `components/PostCard.js` | How each post card looks |
| `components/CelebrityCard.js` | How celebrity cards look |
| `components/Navbar.js` | Top navigation bar |

### To change the site name/title:
→ Search for `InstaSearch` in the files on GitHub and change it

### To change colors:
→ Open `styles/globals.css`, find the `:root` section at the top
→ Change the color values (they start with `#`)

---

## 🆘 TROUBLESHOOTING

**Problem: Site shows blank/error after deploy**
→ Check Vercel → Settings → Environment Variables. All 4 must be added correctly.
→ Redeploy after adding them.

**Problem: Admin panel says "Wrong code"**
→ Make sure `ADMIN_SECRET_CODE` in Vercel exactly matches what you type (case sensitive)

**Problem: "Celebrity not found" on celebrity page**
→ The celebrity was added but the URL slug might be different. Go to admin → Celebrities → copy the name and check the URL

**Problem: Posts not showing on the website**
→ Check that you selected the correct Celebrity when adding the post in admin

**Problem: Supabase error in Vercel logs**
→ Check that your Supabase URL and keys are correct in Vercel environment variables
→ Make sure you ran the SQL schema in Supabase (Step 1, points 7-13)

**Problem: 404 on the live site**
→ Make sure `vercel.json` is in your GitHub repo
→ In Vercel project settings, Root Directory should be empty (blank)

---

## 📱 FUTURE APP

When you're ready to build the mobile app:
- The same Supabase database will be used
- The API routes can be called from a React Native app
- You already have all the data structured correctly for this

---

## 🔒 SECURITY REMINDERS

- NEVER share your `ADMIN_SECRET_CODE`
- NEVER share your `SUPABASE_SERVICE_ROLE_KEY`
- The `.env.local` file (if you create it locally) should NEVER be uploaded to GitHub
- The `.gitignore` file already protects this — don't change it

---

*Built with Next.js + Supabase + Vercel*
*Manual version 1.0*
