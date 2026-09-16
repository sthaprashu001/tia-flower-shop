# Google Business Profile, Search Console & SEO Setup

Complete guide for setting up local SEO, Google presence, and social media for TIA Flower Shop.

---

## 1. Google Business Profile (Local SEO)

### What it does
- Shows your business in Google Maps and local search results
- Displays hours, photos, reviews, and customer Q&A
- Improves visibility when customers search "flower shop near me" or "flowers TIA Kathmandu"

### Setup Steps

1. **Go to:** https://business.google.com
2. **Sign in** with your Google account (create one if needed)
3. **Click "Manage your business"** → **Create or claim a business**
4. **Enter business info:**
   - Business name: `TIA Flower Shop`
   - Category: `Florist` or `Flower Delivery`
   - Address: Near Tribhuvan International Airport, Kathmandu (or your exact address)
   - Phone: Your WhatsApp number (from `.env.local`)
   - Website: `https://tiaflowershop.online`
5. **Add details:**
   - Hours: Mon-Sat 10am-6pm, Sun Closed (adjust to your actual hours)
   - Photos: Upload 3-5 high-quality bouquet photos
   - Description: "Fresh bouquets, khata flags, and flower arrangements for arrivals and departures near TIA"
6. **Verify business:**
   - Google will send a postcard to your address (takes 1-2 weeks)
   - Or use phone verification if available
7. **Add posts:** Update monthly with new products, seasonal offers

### Maintenance
- Respond to customer reviews (positive and negative)
- Update photos monthly
- Add seasonal hours (holidays, special events)
- Answer customer Q&A

---

## 2. Google Search Console

### What it does
- Submits your sitemap to Google
- Monitors search performance (clicks, impressions, rankings)
- Alerts you to indexing issues
- Shows how Google sees your site

### Setup Steps

1. **Go to:** https://search.google.com/search-console/about
2. **Click "Start now"** or **"Go to Search Console"**
3. **Add property:**
   - Select "URL prefix"
   - Enter: `https://tiaflowershop.online`
   - Click "Continue"
4. **Verify ownership** — Google shows 5 methods, easiest is:
   - **HTML tag method:**
     - Copy the `content="..."` value (long random string)
     - Add to `.env.local` and Vercel as: `NEXT_PUBLIC_GOOGLE_VERIFICATION=<string>`
     - The `app/layout.tsx` automatically adds it to `<head>`
     - Click "Verify" in Search Console
5. **Submit sitemap:**
   - Left sidebar → **Sitemaps**
   - Enter: `https://tiaflowershop.online/sitemap.xml`
   - Click "Submit"
6. **Monitor performance:**
   - Left sidebar → **Performance**
   - Shows clicks, impressions, average position, CTR

### What to watch
- "Coverage" tab: Are all pages indexed? Any errors?
- "Enhancements" tab: Check for structured data issues (should show LocalBusiness)
- "Experience" tab: Mobile usability, page speed

---

## 3. Environment Variables to Add

### In Vercel Dashboard

Go to **Settings → Environment Variables** and add:

```
NEXT_PUBLIC_SITE_URL=https://tiaflowershop.online

NEXT_PUBLIC_GOOGLE_VERIFICATION=<your-google-verification-code>

NEXT_PUBLIC_SHOP_ADDRESS=Near Tribhuvan International Airport, Kathmandu, Nepal
NEXT_PUBLIC_SHOP_LATITUDE=27.8176
NEXT_PUBLIC_SHOP_LONGITUDE=85.9124

NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/tiaflowershop
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/tiaflowershop
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@tiaflowershop
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@tiaflowershop
```

(Leave social URLs blank until you create those accounts)

---

## 4. Social Media Strategy & Accounts

### Why it matters
- Drives traffic to your site
- Builds brand awareness and trust
- Improves SEO (backlinks, mentioned brand)
- Direct customer engagement and orders

### Platform Strategy

#### **Instagram** (Priority: HIGH)
- **Best for:** Bouquet photos, behind-the-scenes, seasonal collections
- **Content:** 3-4 posts/week, daily Stories
- **Audience:** Young professionals, tourists, gift-givers
- **Handle:** `@tiaflowershop` or `@tiaflowershop.nepal`
- **First posts:** 5-10 high-quality bouquet photos with descriptions and prices

#### **Facebook** (Priority: MEDIUM)
- **Best for:** Community, reviews, local reach, events
- **Content:** 2-3 posts/week, respond to messages
- **Audience:** Local customers, families, older demographics
- **Handle:** `TIA Flower Shop` or `TIA Flower Shop Kathmandu`
- **First content:** About section + customer testimonials + current product list

#### **TikTok** (Priority: MEDIUM)
- **Best for:** Viral reach, trends, younger audience
- **Content:** 15-30 sec videos: flower arranging, customer reactions, day-in-the-life
- **Audience:** Gen Z, tourists, viral potential
- **Handle:** `@tiaflowershop` or `@tiaflowers.nepal`
- **First videos:** "How we make a bouquet" (slow-mo + music)

#### **YouTube** (Priority: LOW, future)
- **Best for:** Long-form education, tutorials, brand story
- **Content:** 5-15 min videos monthly
- **Audience:** Serious buyers, gift-givers researching
- **First video:** "Day in the life of TIA Flower Shop" or "How to order bouquets near TIA"

### Step 1: Create Accounts (This Week)

**Instagram:**
1. Download Instagram app or go to instagram.com
2. Sign up with email
3. Username: `tiaflowershop` (or `tiaflowershop.nepal` if taken)
4. Bio: "Fresh bouquets for arrivals & farewells near TIA, Kathmandu 🌹 WhatsApp: [your number]"
5. Link website: https://tiaflowershop.online
6. Profile photo: Your best bouquet or TIA Flower Shop logo

**Facebook:**
1. Go to facebook.com
2. Click "Create new Facebook account"
3. Name: `TIA Flower Shop`
4. Follow on-screen setup
5. Add profile photo + cover photo
6. About section: "Fresh bouquet delivery near Tribhuvan International Airport, Kathmandu. Order online at tiaflowershop.online"
7. Add WhatsApp link: https://wa.me/977XXXXXXXXXX

**TikTok:**
1. Download TikTok app or go to tiktok.com
2. Sign up with email
3. Username: `@tiaflowershop` or `@tiaflowers.nepal`
4. Bio: "Fresh bouquets & khata flags near TIA, Kathmandu 🌹 Order: tiaflowershop.online"

### Step 2: Content Calendar (First Month)

**Week 1:**
- Instagram: Post 3 bouquet photos (best angles, clear pricing)
- Facebook: Post about section + 1 product showcase
- TikTok: Post 1 "flower arrangement" video (30 sec)

**Week 2:**
- Instagram: Post 3 more bouquets + 1 customer testimonial
- Facebook: Share Instagram posts
- TikTok: Post 1 "customer unboxing" or "day in the life" video

**Week 3:**
- Instagram: Post featured products + 1 behind-the-scenes
- Facebook: Ask followers "What's your favorite flower?"
- TikTok: Post trending audio + bouquet arrangement

**Week 4:**
- Instagram: Post seasonal/special occasion arrangements
- Facebook: Respond to comments, share 1 customer review
- TikTok: Post 1 tutorial or "how to order" video

### Step 3: Content Ideas (Reusable)

**Photos (Instagram, Facebook):**
- [ ] All current bouquets (3-4 angles each)
- [ ] Khata flags and special items
- [ ] Flowers in use (customer receiving at airport)
- [ ] Workshop/arrangement process
- [ ] Seasonal collections
- [ ] Team photos (builds trust)
- [ ] Customer testimonials (screenshots or photos)

**Videos (TikTok, YouTube, Instagram Reels):**
- [ ] "How we make a bouquet" (real-time, 30-60 sec)
- [ ] "Unboxing" from customer POV
- [ ] "What flowers are trending?" (10-15 sec)
- [ ] "Ring light vs natural light" bouquet comparison
- [ ] "Day in the life at TIA Flower Shop"
- [ ] Customer reviews (short clips)
- [ ] "Preparing for busy season"
- [ ] Trending audio + bouquet shots

**Captions (all platforms):**
- Include price: "Red Rose Bouquet 🌹 Rs. 1,000 | Order at tiaflowershop.online"
- Call to action: "Order now for today's delivery! Link in bio ⬆️"
- Location tag: Always tag Kathmandu, Tribhuvan Airport, Nepal
- Hashtags: #TiaFlowerShop #KathmanduFlorist #FlowerDelivery #AirportFlowers

### Step 4: Link Accounts Together

In each platform's settings, add links to your website and other social accounts:

**Instagram bio:**
```
Fresh bouquets for TIA ✈️ 🌹
Order: tiaflowershop.online
WhatsApp: [link to wa.me/...]
```

**Facebook About:**
```
Website: tiaflowershop.online
Phone: [your WhatsApp]
Follow us on Instagram: @tiaflowershop
```

**TikTok bio:**
```
Fresh flowers near TIA, Kathmandu 🌹
📱 Order: tiaflowershop.online or WhatsApp
```

---

## 5. Add Social Links to Code (Once Accounts Exist)

Once you've created the accounts:

1. **In Vercel Environment Variables**, add:
```
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/tiaflowershop
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/TIAFlowerShop
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@tiaflowershop
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@tiaflowershop
```

2. **Deploy** — footer automatically shows the links

3. These also appear in your schema.org markup for SEO:
```json
"sameAs": [
  "https://instagram.com/tiaflowershop",
  "https://facebook.com/TIAFlowerShop",
  "..."
]
```

---

## 6. Tracking & Analytics

### Google Analytics
1. Go to https://analytics.google.com
2. Create account → Connect to `tiaflowershop.online`
3. Add tracking code to Vercel if needed (Next.js has built-in support)
4. Monitor: Traffic source, pages visited, user behavior

### Social Media Insights
- **Instagram:** Insights tab shows followers, reach, engagement
- **Facebook:** Analytics → see page insights, post performance
- **TikTok:** Analytics tab shows views, followers, engagement

### What to track
- Which platform sends most traffic?
- Which posts get most engagement?
- Which products are most popular?
- Conversion: Social clicks → orders

---

## 7. Monthly Maintenance Checklist

- [ ] Post on Instagram 12-16 times (3-4/week)
- [ ] Post on Facebook 8-12 times (2-3/week)
- [ ] Post on TikTok 4-8 times
- [ ] Respond to comments/DMs within 24 hours
- [ ] Update Google Business Profile with new photos
- [ ] Check Google Search Console for errors
- [ ] Review analytics — top posts, top sources
- [ ] Update featured products on homepage
- [ ] Seasonal promotions (holidays, events)

---

## 8. Quick Wins (Do This First)

**This week:**
- [ ] Set up Google Business Profile
- [ ] Verify Google Search Console
- [ ] Create Instagram, Facebook, TikTok accounts
- [ ] Post 3 bouquet photos on each platform
- [ ] Add social URLs to `.env.local`

**Next week:**
- [ ] Record first TikTok video (flower arrangement)
- [ ] Respond to all comments
- [ ] Check Google Search Console for indexing

**Next month:**
- [ ] Analyze which platform sends most traffic
- [ ] Double down on that platform
- [ ] Seasonal promotion campaign

---

## Links Reference

- Google Business: https://business.google.com
- Google Search Console: https://search.google.com/search-console
- Instagram: https://instagram.com
- Facebook: https://facebook.com
- TikTok: https://tiktok.com
- Your site: https://tiaflowershop.online
- Admin dashboard: https://tiaflowershop.online/admin
