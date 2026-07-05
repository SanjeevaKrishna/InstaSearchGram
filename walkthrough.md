# Walkthrough - Redesign Trending Reels Section & Time Countdown

We have completed the redesign of the leaderboard row details hierarchy, integrated a dynamic time countdown system, added a **Most Viewed Reels** section, and implemented an intermediate **Watch Reel** detail page.

We have also implemented comprehensive Search Engine Optimization (SEO) fixes to resolve Google Search Console indexing and Soft 404 issues.

Finally, we have integrated Adsterra advertisement units across key pages in a highly optimized, responsive, and performance-friendly manner.

## Changes Made

### 1. Database Schema
* **[update-viral-reels-followers.sql](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/update-viral-reels-followers.sql):**
  - Created a SQL script to add the `followers_text` column to `public.viral_reels` table.
* **[create-most-viewed-reels.sql](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/create-most-viewed-reels.sql): [NEW]**
  - Created a SQL script to define the `most_viewed_reels` table schema and enable public read RLS policies.

### 2. Frontend Tab Switcher & Layout Restructuring
* **[trending.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/trending.js):**
  - **Segmented Tab Switcher**: Added a premium-looking CSS tab switcher at the top to toggle between "Trending Reels" and "Most Viewed".
  - **Compact Page Spacing**: Reduced spacing to keep the tables near the top of the viewport.
  - **Simplified Title**: Small, simple title `Trending Reels` with `India Trends` inline subtitle.
  - **Hierarchy Redesign**: Structured row info: Top (full Caption), Middle (Creator name), Bottom (Followers Count beside Time Ago).
  - **Conditional Redirect**: Clicking on a **Trending Reel** directly transfers the user to Instagram. Clicking on a **Most Viewed Reel** routes internally to our new detail page `/reel/[id]`.

### 3. Dynamic Reel Detail Page
* **[pages/reel/[id].js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/reel/%5Bid%5D.js): [NEW]**
  - Displays details of a specific reel: Title/Caption, large preview cover (with a hover play button overlay), creator name/avatar, and upload date.
  - Features a prominent **"Watch Reel on Instagram"** call-to-action button with modern Instagram styling gradients.
* **[pages/api/reels/[id].js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/api/reels/%5Bid%5D.js): [NEW]**
  - Queries `most_viewed_reels` (and fallbacks to `viral_reels`) to get reel metadata, performing matching creator fallback lookups in parallel. Handles dynamic SEO slugs.

### 4. Admin Dashboard Section
* **[index.js (Admin)](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/admin/index.js):**
  - **Most Viewed Reels Tab**: Added a brand new sidebar tab for managing most viewed reels.
  - **Uploaded Date Calendar Picker**: Most Viewed Reels use a calendar date picker input in the form, whereas Trending Reels continue to use the dynamic hours-ago offset.

### 5. Live (Most Followed) Section Spacing Optimization
* **[pages/live.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/live.js):**
  - Moved **Most Followed** and **Voting** tabs to the left.
  - Moved the **Language Filter Dropdown** to the right side of the exact same row.
  - Reduced page margins and padding offsets to bring the leaderboard table directly to the top of the screen.

### 6. Search Engine Optimization & Redirects
* **[vercel.json](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/vercel.json):**
  - Flipped hosting-level redirects to canonicalize all `www.spialr.com` requests directly to `https://spialr.com` with a 301 Permanent Redirect.
* **[pages/_app.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/_app.js):**
  - Added a dynamic canonical tag calculation (`https://spialr.com${pathname}`) and rendered `<link rel="canonical" ... />` inside the global Head element.
  - Updated all Open Graph, Twitter, and Schema JSON-LD site metadata properties to reference the canonical domain (`https://spialr.com`).
* **[public/robots.txt](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/public/robots.txt):**
  - Updated the sitemap reference to point to the canonical address: `https://spialr.com/sitemap.xml`.
* **[public/sitemap.xml](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/public/sitemap.xml):**
  - Overwrote sitemap locations to only list HTTPS canonical non-www URLs.

### 7. Soft 404 Status Code Resolution
* **[pages/celebrity/[slug].js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/celebrity/%5Bslug%5D.js) & [pages/reel/[id].js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/reel/%5Bid%5D.js):**
  - Converted these dynamic pages to Server-Side Rendering (SSR) via `getServerSideProps`.
  - The server queries the Supabase database. If the request celebrity slug or reel ID is not found, it returns `notFound: true`, instructing Next.js to serve the default error page with a real **HTTP 404 Not Found** status code. This completely resolves Google Search Console Soft 404 errors.

### 8. Adsterra Ads Integration
* **[components/AdUnits.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/components/AdUnits.js): [NEW]**
  - Created client-only React components for Adsterra's Native banner, 300x250 banner, and 320x50 mobile banner.
  - Utilized `useState` + `useEffect` to guarantee ads only trigger after React mount, avoiding hydration mismatches.
  - Wrapped iframe-based banner codes in isolated `srcDoc` iframe documents to prevent `window.atOptions` configuration collisions when rendering multiple distinct scripts.
* **[styles/globals.css](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/styles/globals.css):**
  - Added `.mobile-only-ad` media query to hide 320x50 mobile units on screen widths larger than 768px.
* **[pages/index.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/index.js):**
  - Placed `Banner320x50` (mobile-only) below the search input field container.
* **[pages/celebrity/[slug].js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/celebrity/%5Bslug%5D.js):**
  - Placed `NativeAdUnit` right below the "About" biography section.
  - Placed `Banner300x250` at the very bottom of the page wrapper before the closing `<main>`.
* **[pages/trending.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/trending.js):**
  - Placed `NativeAdUnit` after every 9 reels in the standing rows.
  - Placed `Banner300x250` after the 15th reel standing row.
* **[pages/live.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/live.js):**
  - Placed `Banner320x50` (mobile-only) below the subtabs/dropdown filters row.
  - Placed `NativeAdUnit` after every 18 rows in the Most Followed and Voting standings lists.
  - Placed `Banner300x250` after the 36th row in the standings lists.
* **[pages/all.js](file:///c:/Users/Admin/Downloads/Spialr/instaSearch/pages/all.js):**
  - Placed `Banner320x50` (mobile-only) below the page title.
  - Placed `NativeAdUnit` after every 18 profiles in the alphabetical list.
  - Placed `Banner300x250` after the 36th profile.

---

## Verification Results
* Both the public leaderboard `/trending` page and the `/admin` page compiled successfully (`200 OK` on server).
* Non-existent paths like `/celebrity/does-not-exist` and `/reel/does-not-exist` return a real `404` status code.
* All modified routing pages (`/`, `/all`, `/trending`, `/live`, `/celebrity/[slug]`) compile successfully with ads and respond with `200 OK`.
