# SPADE ARC — Setup Guide

A 20-week premium fitness web app. $19.99/month subscription. Built by Sazyi Rey.

---

## Prerequisites

- Node.js 18+
- A Supabase account → supabase.com
- A Stripe account → stripe.com

---

## 1. Install dependencies

```bash
cd spade-arc
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `spade-arc`, choose a region
3. Copy your **Project URL** and **anon public key** from Project Settings → API

---

## 3. Run the database schema

In the Supabase SQL Editor, paste and run the full contents of:

```
supabase/schema.sql
supabase/seed.sql
```

This creates all tables, RLS policies, indexes, and the leaderboard function.

---

## 4. Configure Stripe

1. Go to [stripe.com](https://stripe.com) → Products → Add product
   - Name: **SPADE ARC Premium**
   - Price: **$19.99 / month** (recurring)
2. Copy the **Price ID** (starts with `price_`)
3. Copy your **Publishable key** from Developers → API keys

### Stripe Webhook (for subscription status sync)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://yourdomain.com/api/stripe-webhook`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Webhook handler (deploy to Supabase Edge Functions or Vercel)

The webhook should update `profiles.subscription_status` based on the event:

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const sub = event.data.object as Stripe.Subscription
  const customerId = sub.customer as string

  let status = 'trial'
  if (event.type === 'customer.subscription.created' && sub.status === 'active') status = 'active'
  if (event.type === 'customer.subscription.updated') {
    status = sub.status === 'active' ? 'active' : sub.status === 'canceled' ? 'cancelled' : 'expired'
  }
  if (event.type === 'customer.subscription.deleted') status = 'cancelled'

  await supabase.from('profiles')
    .update({ subscription_status: status, stripe_customer_id: customerId })
    .eq('stripe_customer_id', customerId)

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

---

## 5. Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_ID=price_...
VITE_APP_URL=https://yourdomain.com
```

---

## 6. Generate PWA icons

The PWA needs PNG icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

Use the SVG at `public/icons/favicon.svg` as a source. You can generate PNGs with:

```bash
# Using Inkscape:
inkscape public/icons/favicon.svg -w 192 -h 192 -o public/icons/icon-192.png
inkscape public/icons/favicon.svg -w 512 -h 512 -o public/icons/icon-512.png

# Or use any online SVG → PNG converter
# Or use sharp: npx sharp-cli -i public/icons/favicon.svg -o public/icons/icon-192.png resize 192 192
```

---

## 7. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 8. Deploy (Vercel recommended)

```bash
npm run build
```

Then deploy the `dist/` folder.

**Vercel:**
1. `npm i -g vercel`
2. `vercel --prod`
3. Add all env vars in Vercel Dashboard → Settings → Environment Variables

**Netlify:**
1. Connect repo or drag `dist/` to Netlify
2. Build command: `npm run build`
3. Publish dir: `dist`
4. Add env vars in Site Settings → Environment

---

## 9. Supabase Auth configuration

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**`

---

## 10. Enable Supabase Storage (progress photos)

In Supabase Dashboard → Storage → New bucket:
- Name: `progress-photos`
- Public: No (private)
- File size limit: 10MB
- Allowed MIME types: `image/jpeg,image/png,image/webp`

Add RLS policy:
```sql
CREATE POLICY "Users can manage own photos"
ON storage.objects FOR ALL
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Architecture notes

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (dark navy design system) |
| Animation | Framer Motion |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Payments | Stripe (monthly subscription) |
| Charts | Recharts |
| i18n | i18next (English + Spanish) |
| PWA | vite-plugin-pwa + Workbox |

## Program structure

```
Phase I   → Weeks 1–5   (Mind-muscle, full ROM, 10-15 rep range)
Phase II  → Weeks 6–10  (Strength, 6-10 rep range)
Phase III → Weeks 11–15 (Intensity, cut begins, 4-8 rep range)
Phase IV  → Weeks 16–20 (Peak, dropsets, finish strong)
```

**6 workout days:**
- Day 1 — Back Width
- Day 2 — Legs Quads
- Day 3 — Chest & Arms
- Day 4 — Legs Hamstrings
- Day 5 — Shoulders & Back Thickness
- Day 6 — Arms & Core (every other week)

---

## Creator

**Sazyi Rey** — Program design, exercise selection, phase periodization

Built with SPADE ARC framework. All rights reserved.
