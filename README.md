# Small Shop

A minimal e-commerce web app for a small business: customers browse products, add several to a cart, and place an order. The business can view every order that comes in. Built as a 180-minute timed technical exercise.

- **Live URL:** https://small-shop-gules.vercel.app
- **Repo:** https://github.com/ShayOz318/small-shop

## Stack

- **Frontend:** React + Vite (plain JS, no TypeScript — chosen for speed under the time limit)
- **Database:** Supabase (Postgres), accessed directly from the client with the public/publishable key — no custom backend server
- **Auth/security:** Supabase Auth (email/password) for the business user, combined with Row Level Security (RLS) policies on every table; customers place orders anonymously through a controlled Postgres function (see below)
- **Deployment:** Vercel, connected to the GitHub repo (static build, zero backend to host)

## What works

- **Product catalog** — products are pulled live from a `products` table in Supabase (not hardcoded). Each has a name, description, price, and optional image.
- **Search & filter** — client-side search by product name and a min/max price range, on top of the already-loaded product list (no extra DB calls per keystroke). This is the free-choice "additional feature."
- **Multi-product cart** — customers can select any number of products, adjust quantity per item, remove items, and see a running total before checking out.
- **Order placement** — checkout collects full name, phone number, email, and shipping address, and writes the order to Supabase across two tables (see Schema below). All four fields are required, both in the form and at the database level.
- **Business order view (authenticated)** — an in-app "Orders" tab is gated behind a login form. Only after signing in with the one Supabase Auth business account does it show the orders table: date, customer, contact info, shipping address, products/quantities, and total. Logged-out visitors (and the public anon API key) cannot read the `orders`/`order_items` tables at all — enforced by RLS/grants at the database level, not just hidden in the UI.
- **Styling** — centered header, blue/red/white color scheme throughout, responsive layout (stacks to one column on narrow screens).

## Database schema

```sql
products (id, name, description, price, image_url)

orders (id, customer_name, customer_email, phone, shipping_address, created_at)

order_items (id, order_id -> orders.id, product_id -> products.id, quantity)
```

`orders` holds one row per checkout ("order header"); `order_items` holds one row per product within that order. This normalized shape is what makes multi-product orders possible — an earlier version had a single `product_id`/`quantity` pair directly on `orders`, which only supported one product per order, and was migrated away from once multi-product carts were added.

## Key decisions

- **No custom backend.** The React app talks to Supabase directly via `@supabase/supabase-js`, using the public/publishable key. All access control is enforced by Postgres RLS policies and grants — this kept the whole build to a single deployable static site.
- **Products are read-only from the app.** There's no UI to add/edit products — that's done directly in the Supabase dashboard (Table Editor / SQL Editor). Building a product-management UI wasn't required and would have cost time better spent on the required customer/order flow.
- **Real, database-level protection for the Orders view — not just a hidden button.** `anon` (the public key embedded in the client) has **no** select/insert grants on `orders` or `order_items` at all. Only the `authenticated` role (i.e. someone signed in via Supabase Auth) has `select`, via an RLS policy scoped `to authenticated`. There's exactly one business account, created manually in the Supabase dashboard — the app has no public sign-up flow.
- **Anonymous checkout without direct table access.** Since customers place orders without logging in, but `anon` can no longer write to `orders`/`order_items`, checkout goes through a single Postgres function, `place_order(...)`, marked `security definer` and granted `execute` (not table access) to `anon`. It validates nothing beyond what the DB constraints already enforce, but it means an anonymous visitor can only create an order shaped exactly like this function allows — not run arbitrary inserts/selects against the tables.
- **Vite + plain React over a framework like Next.js**, since the app has no server-rendered routes or API routes to justify one — everything is client-side against Supabase.
- **Vercel for deployment** — zero-config for a Vite static build, direct GitHub integration, environment variables for the Supabase URL/key.

## Limitations / what's not finished

- **No stock/inventory tracking.** Products can be ordered in any quantity regardless of real availability.
- **No order status.** Every order just exists; there's no way to mark one as fulfilled/shipped/cancelled.
- **No email confirmation** sent to the customer after ordering — just an on-screen confirmation.
- **Minimal validation** — relies mostly on HTML5 `required`/`type=email`/`type=tel` input validation, not custom server-side checks beyond the NOT NULL DB constraints.
- **No automated tests.**

## What I'd do with another hour

1. **Add a `stock` column** to `products`, disable/hide out-of-stock items in the UI, and decrement stock on order (inside the `place_order` function, to keep it atomic).
2. **Add an order status** column (`new` / `fulfilled` / `cancelled`) with buttons in the Orders view for the business to update it.
3. **Polish validation and error states** — clearer inline errors, phone/email format checks, retry handling for failed Supabase calls.
4. **Add pagination** to the Orders table once there are many rows.
5. **Tighten the business login further** — e.g. rate-limiting sign-in attempts, or restricting the RLS policy to one specific email via `auth.jwt() ->> 'email'` instead of any `authenticated` user (currently equivalent in practice, since there's no public sign-up, but would be stricter defense in depth).

## AI usage

Built with Claude (Anthropic) as a pair-programming assistant throughout — architecture decisions, schema design, component code, styling, debugging, and the Supabase Auth/RLS security work above. Full conversation: https://claude.ai/code/session_013PHgNefnQan72t2PKqqC3L
