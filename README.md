# Private AI Automation Funnel (Next.js 14)

## 1) Stripe Setup
1. Create 6 Stripe products/prices matching your funnel:
   - Entry ($27)
   - Bump 1 ($17)
   - Bump 2 ($19.99)
   - Bump 3 ($17)
   - Upsell 1 ($253)
   - Upsell 2 ($999)
2. Copy each `price_...` value into:
   - `STRIPE_PRICE_ENTRY`
   - `STRIPE_PRICE_BUMP1`
   - `STRIPE_PRICE_BUMP2`
   - `STRIPE_PRICE_BUMP3`
   - `STRIPE_PRICE_UPSELL1`
   - `STRIPE_PRICE_UPSELL2`
3. Copy API keys:
   - Publishable key -> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key -> `STRIPE_SECRET_KEY`
4. No Stripe metadata needs to be manually configured in dashboard. Metadata is set programmatically during checkout/upsell API calls.

## 2) Supabase Setup
1. Create a Supabase project.
2. Open SQL editor and run [`schema.sql`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/schema.sql).
3. Confirm tables exist: `users`, `purchases`, `access`.
4. RLS is enabled by schema. Add policies if client-side reads are introduced later.
5. Copy values:
   - Project URL -> `SUPABASE_URL`
   - Service role key -> `SUPABASE_SERVICE_ROLE_KEY`

## 3) Whop Setup
1. Create 6 Whop products (one per funnel item):
   - Entry
   - Bump 1
   - Bump 2
   - Bump 3
   - Upsell 1
   - Upsell 2
2. Copy each product ID (`prod_...`) into:
   - `WHOP_PRODUCT_ENTRY`
   - `WHOP_PRODUCT_BUMP1`
   - `WHOP_PRODUCT_BUMP2`
   - `WHOP_PRODUCT_BUMP3`
   - `WHOP_PRODUCT_UPSELL1`
   - `WHOP_PRODUCT_UPSELL2`
3. Set `WHOP_API_KEY`.
4. Set `WHOP_COMPANY_ID` if your Whop key is company-scoped.
5. Webhook fulfillment creates a Whop membership for each purchased product.

## 4) Meta Pixel Setup
1. In Meta Events Manager, create/select your Pixel.
2. Copy Pixel ID into `NEXT_PUBLIC_META_PIXEL_ID`.
3. Pixel script is injected in [`components/MetaPixel.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/components/MetaPixel.tsx).
4. Events fired in [`lib/pixel.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/lib/pixel.ts):
   - `ViewContent`, `InitiateCheckout`, `AddToCart`, `Purchase`, upsell decline custom event.

## 5) Vercel Deployment
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Add all environment variables from [`.env.local`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/.env.local) into Vercel Project Settings.
4. Set production domain and update `NEXT_PUBLIC_SITE_URL`.
5. Deploy.

## 5.1) Instant Lead Alert Setup (Call Within 60 Seconds)
1. Checkout now requires `email + phone + consent` before payment options are shown.
2. Leads are captured in Supabase `leads` table via [`app/api/leads/capture/route.ts`](/Users/ricksessoms/Desktop/Mac%20-%20Code%20Box%20(VS%20code)/Low%20Ticket%20Funnel%20-%20Private%20Ai/app/api/leads/capture/route.ts).
3. Configure Pushover env vars for instant phone push alerts:
   - `PUSHOVER_APP_TOKEN`
   - `PUSHOVER_USER_KEY`
4. Optional but recommended for email reliability:
   - `RESEND_FROM_EMAIL` (verified sender/domain in Resend)

## 6) Stripe Webhook Registration
1. In Stripe Dashboard -> Developers -> Webhooks -> Add endpoint.
2. Endpoint URL:
   - `https://YOUR_DOMAIN/api/webhooks/stripe`
3. Subscribe to events:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `payment_intent.payment_failed`
4. Copy signing secret into `STRIPE_WEBHOOK_SECRET`.

## 7) Test Checklist
1. Entry only:
   - Buy entry product, verify redirect flow `/u1 -> /u2 -> /thank-you`.
   - Confirm `users`, `purchases`, `access.entry_unlocked=true`.
2. Entry + all bumps:
   - Toggle all bumps, complete payment.
   - Confirm access booleans for `bump1/bump2/bump3` are true.
3. Entry + upsell1:
   - Accept upsell 1 in `/u1`, decline `/u2`.
   - Confirm `upsell1_unlocked=true`.
4. Entry + upsell2:
   - Decline `/u1`, accept `/u2`.
   - Confirm `upsell2_unlocked=true`.
5. Refund flow:
   - Refund a payment in Stripe.
   - Confirm matching access boolean flips to false and Whop membership termination is attempted for the refunded product.
6. Lead speed-to-contact:
   - Enter checkout details with phone.
   - Confirm a new row appears in `leads`.
   - Confirm push alert appears on your phone via Pushover.

## Local Development
1. Install deps: `npm install`
2. Run dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## File Map
- [`app/page.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/page.tsx)
- [`app/checkout/page.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/checkout/page.tsx)
- [`app/u1/page.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/u1/page.tsx)
- [`app/u2/page.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/u2/page.tsx)
- [`app/thank-you/page.tsx`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/thank-you/page.tsx)
- [`app/api/checkout/create-intent/route.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/api/checkout/create-intent/route.ts)
- [`app/api/leads/capture/route.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/api/leads/capture/route.ts)
- [`app/api/upsell/charge/route.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/api/upsell/charge/route.ts)
- [`app/api/webhooks/stripe/route.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/app/api/webhooks/stripe/route.ts)
- [`lib/stripe.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/lib/stripe.ts)
- [`lib/supabase.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/lib/supabase.ts)
- [`lib/whop.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/lib/whop.ts)
- [`lib/notify.ts`](/Users/ricksessoms/Desktop/Mac - Code Box (VS code)/Low Ticket Funnel - Private Ai/lib/notify.ts)
