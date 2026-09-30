# Premier Products® — Drain Assembly Storefront

A premium, minimalist product showcase for a plumbing brand whose hero product is a
**pop-up drain assembly**, built around an interactive 3D viewer that lets visitors take
the product apart.

Full **MERN** stack: React + Vite + Tailwind on the front, Express + MongoDB on the back,
with JWT auth, cart, wishlist, checkout and an admin dashboard.

---

## Quick start

### One command (recommended)

```bash
cd pop-up-drain-site
./start.sh
```

Open **http://localhost:4000**. The script checks MongoDB, seeds on first run, builds the
client and the server bundle if they're missing, and then serves everything from a single
process. Flags: `--rebuild` forces a fresh build, `--dev` also runs Vite.

MongoDB must be running: `brew services start mongodb-community`.

**Seeded admin:** `admin@premierproducts.com` / `Admin123!` (override with `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`). The sign-in page also shows these for convenience.

### Two terminals (development)

```bash
# 1. API  (needs MongoDB running)
cd server
cp .env.example .env          # then set MONGODB_URI and a real JWT_SECRET
npm install
npm run seed                  # creates 6 products, hotspots and the admin user
npm run dev                   # http://localhost:4000

# 2. Client
cd client
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173.

### Production (single process)

The Express server serves the built client from `client/dist`, so the whole app is one
process on one origin:

```bash
cd client && npm run build
cd ../server && npm run build   # bundles the API into dist/server.cjs
NODE_ENV=production npm start   # http://localhost:4000
```

> **Why the server is bundled.** `npm run build` inlines every dependency into a single
> `dist/server.cjs` (~4.7 MB). Normally this is a nicety, but on a slow, busy, or nearly
> full disk Node can spend *minutes* walking the module graph — a single `import "express"`
> was measured at 264 s cold versus 74 ms warm. The bundle reduces startup to one file
> read, which brought the boot time from "did not finish in five minutes" to about three
> seconds. The bundle is emitted as CommonJS because mongoose and friends call
> `require("fs")` internally, which an ESM output cannot express.
>
> For the same reason, `server.js` preloads `client/dist` into memory at boot (31 files,
> ~3 MB) rather than streaming from disk: serving the 1.5 MB GLB off disk intermittently
> failed with `ETIMEDOUT` mid-read, which surfaced as a 500 on the 3D model and a blank
> page. `npm start` still works as a fallback if the bundle is missing.

### Ports

| Service | Port | Notes |
| --- | --- | --- |
| API + static client | `4000` | Vite proxies `/api` here in development |
| Vite dev server | `5173` | **Vite auto-increments if 5173 is taken.** On the machine this was built on, 5173–5175 were already occupied, so the dev server ran on 5176. Check the Vite banner for the real port. |

> Port `5000` is unusable on stock macOS — AirPlay Receiver already owns it. The API
> defaults to `4000` for that reason.

---

## The scroll narrative

The homepage explorer is a **scroll-driven narrative**, not a viewer you have to drive.
The section is a tall spacer with a `100vh` sticky stage; scroll position becomes a
continuous progress value, and that drives a storyboard built from the product's own
hotspots:

| Beat | Camera | Copy |
| --- | --- | --- |
| The assembly | whole product, assembled | tagline |
| Part 01 — Stopper Cap | flies to the cap, close | summary + spec table |
| Part 02 — Pivot Collar | travels down to the collar | summary + spec table |
| Part 03 — Sealing Gasket | down to the gasket | summary + spec table |
| Part 04 — Drain Flange | down to the flange | summary + spec table |
| Part 05 — Threaded Body | down to the threaded shank | summary + spec table |
| Every part | pulls all the way back, fully separated | "all 5 parts, in assembly order" |
| The complete product | reassembles, hero framing | "twenty-three parts, one pivot" |

While a part is being introduced it is **highlighted and everything else is dimmed**
(by lowering `envMapIntensity` rather than going transparent — these are thin nested
shells, and fading them produces sorting artefacts). Its spec card opens automatically
and its numbered marker goes active. The explode runs concurrently, so the part is
being *moved* as the camera arrives on it.

Three details make it read as authored rather than scrubbed:

- **Damped progress.** Scroll is eased with a frame-rate independent lerp, so a flicked
  scroll wheel arrives as one continuous camera move instead of a jump.
- **Eased crossfades.** Chapter boundaries blend with a smootherstep, so the camera eases
  out of one part and into the next rather than cutting.
- **No 60 fps React.** Only the *chapter index* lives in React state — a handful of
  renders per scroll. The continuous values (progress, explode, focus height, focus
  distance) are written to a plain ref and read by the render loop. An earlier version
  pushed progress through state, which starved the copy transition and left the panel
  lagging a beat behind the dots.

Framing hands off smoothly: part beats script an explicit focus, whole-assembly beats
blend back into the camera rig's own fit using the same formula, so there is no jump at
the seam.

The chapter rail is clickable and scrolls to that beat; on mobile it becomes a dot strip
with a progress hairline.

### Where the narrative appears

The narrative is the **consistent** experience wherever the product is showcased — it is
not a homepage-only flourish:

| Page | What you get |
| --- | --- |
| Home | the story, after the hero |
| About | the same story, under "One push, and it stays open" |
| Product | the **interactive** viewer beside the price and Add to Cart, *plus* the story further down, below the specifications |

The product page keeps both on purpose. Beside a price and a buy button, dragging the
explode slider is the most direct way to understand what you are about to buy; the story
is the guided version for visitors who would rather scroll than drag. The story's call
to action is suppressed there, since the buy button is already above it.

### Only one live canvas at a time

A page can hold two viewers, and two live WebGL contexts halve the frame rate for
everyone. Both `ProductViewer` and `ScrollStory` therefore gate themselves with
`useInView()` and pass R3F's `frameloop="never"` to a viewer that is scrolled away.
That parks the render loop without tearing down the context, so resuming is instant.
Measured on the product page: frame rate is identical with the other viewer live or
parked, so parking costs nothing and prevents the collapse.

Note that the parked `<canvas>` element still exists in the DOM — `frameloop="never"`
stops frames being *scheduled*. Count live contexts by frame rate, not by counting
`canvas` tags.

---

## The 3D model: what we found, and what we did about it

This is the part of the brief that needed the most judgement, so it is worth stating
plainly.

The supplied `pop_up_drain_final_animation.glb` **does not contain a usable exploded
view.** Read directly out of the file:

- It has **no shape keys / morph targets** at all.
- Its 22 animation clips are single translation channels running 0 → 15 s in four
  stages, then a reverse:

  | Stage | Parts | Authored travel |
  | --- | --- | --- |
  | t≈2.6–4.6 s | stopper cap assembly | **+28.0** |
  | t≈4.6–6.7 s | pivot collar group | **+18.0** |
  | t≈4.6–6.7 s | actuator shaft | **+10.0** |
  | t≈6.7–8 s | flange group | **−8.0** |
  | t≈7–11 s | gasket | **−15.0** |
  | t≈8–11 s | body group | **−25.0** |
  | t≈8–11 s | stopper tip | **−38.0** |
  | t≈12–15 s | everything returns to rest | — |

Two things make the brief's suggested approach — `action.time = (pct/100) * duration` —
wrong for this asset:

1. **Scale.** The assembled drain is **4.46 units tall** (`y` from −1.63 to 2.83). A
   28-unit throw puts the stopper cap roughly **six model-heights off screen**. The
   camera would have to pull back until the product was a speck, and every part would
   be separated by a void.
2. **Monotonicity.** The clip explodes, holds, then reassembles. A 0–100 % slider mapped
   onto clip time runs the teardown *forwards* for the first half and *backwards* for
   the second half — so dragging the slider back to 0 % would visibly re-assemble the
   product from the bottom up.

### What we did instead

We kept what the artist's animation is genuinely good for — **which parts move
together, their vertical order, and the sequence in which they peel away** — and retargeted
the distances so the result is monotonic and actually frames well. The model geometry,
materials and part names are never modified.

- `client/src/data/explodeConfig.js` is the single source of truth. It documents the
  measurements above, defines the seven explode tiers with per-tier offsets and a
  stagger rank, and exposes `tierProgress()` / `explodeOffsetFor()`.
- At 100 % the assembly spans ~11 units against an assembled height of 4.46, so parts are
  clearly separated rather than nudged apart.
- The stagger preserves the authored peel: the cap lifts first, then the shaft and
  collar, then the tip, flange, gasket and body.

If you would rather have the literal clip, or a properly re-authored one baked in
Blender, `pop_up_drain_step_animation.blend` and Blender 5.2.2 are available — but the
asset as shipped is not usable for an explode slider.

### Hotspots

The GLB has 24 semantically named nodes (`Stopper_Cap`, `Pivot_Collar`,
`Rubber_Gasket`, `Drain_Flange`, `Drain_External_Threads`, …), so each hotspot stores a
**GLB node name** and is projected through that node's live world transform every frame.
That is what keeps a marker glued to its part while the explode slider moves that part —
rather than a fixed world position that would drift off as soon as anything moved.

Markers are plain DOM elements positioned imperatively from a `useFrame` loop, not
drei's `<Html>`. They stay crisp at any DPI and moving one never triggers a React render.
Spec cards are docked to the canvas edge nearest their marker, so a card never covers the
part it is describing and never clips out of frame.

### Cross-section variant

The brief asks for an assembled view and a cross-section/cutaway view. There is no
separate cutaway `.glb`, so rather than ship a second 1.5 MB asset the cutaway is
produced **on the client**: a `THREE.Plane` clips the outer chrome shell and the cut
parts are rendered double-sided, which reveals the brass core, pivot pin and threaded
shank — matching the reference video's cutaway.

### Lighting

`StudioEnvironment` builds the HDRI from local `<Lightformer>`s, so the site needs no CDN
round-trip. The base tone is deliberately **dark**: the chrome parts have a metallic
factor of 1.0 and reflect only the environment, so a uniformly pale environment renders
them as flat white plastic. Contrast between dark areas and bright light cards is what
makes them read as chrome.

### "Press to Pop"

The baked clip does not contain the real press cycle, so the mechanism demo is authored
in `pressOffsetFor()` to match how the hardware actually works: the cap is pushed down,
the pivot collar rocks on its pin, and the stopper tip is levered up out of its seat.

---

## Architecture

```
pop-up-drain-site/
├── server/
│   ├── config/db.js              Mongoose connection
│   ├── models/                   Product, User, Cart, Order, ContactMessage
│   ├── controllers/              one per resource
│   ├── routes/                   route tables, mounted in routes/index.js
│   ├── middleware/               auth.js (JWT guards), errorHandler.js
│   ├── utils/
│   ├── seed/seed.js              products, hotspots, admin user
│   ├── server.js                 app, helmet/CSP, static client, graceful shutdown
│   └── .env.example
└── client/
    ├── public/models/            pop_up_drain_final_animation.glb
    └── src/
        ├── components/
        │   ├── layout/           Navbar, Footer, ContactStrip, ChatBubble, ScrollToTop, NewsletterForm
        │   ├── three/            SceneCanvas, DrainModel, CameraRig, Hotspot,
        │   │                     ExplodeSlider, StudioEnvironment, ProductViewer
        │   ├── home/             Hero, ScrollStory, FeatureBreakdown
        │   ├── product/          ProductCard (live 3D thumbs where a model exists)
        │   ├── auth/             AuthForm
        │   └── ui/               Button, Accordion, Reveal, Feedback, Page
        ├── pages/                Home, ProductDetail, Cart, Checkout,
        │                         OrderConfirmation, About, FAQs, Contact, Wishlist,
        │                         Login, Register, Account, Admin, NotFound
        ├── context/              AuthContext, CartContext, WishlistContext
        ├── hooks/                useScrollStory.js, useInView.js, useMediaQuery.js
        ├── api/                  axios instance + endpoint functions
        ├── data/                 explodeConfig.js, content.js, paths.js
        └── styles/index.css      Tailwind v4 theme tokens
```

`<ProductViewer product={product} />` is the reusable 3D viewer, used unchanged on the
homepage, the About page and the product detail page.

### Data flow for the 3D viewer

The slider, the carousel dots, the hotspot list and the scroll story all write to one
plain ref rather than to React state, because it is read every animation frame; routing
it through state would re-render the tree 60 times a second for no benefit.
`DrainModel` damps the explode value and applies per-node offsets; `CameraRig` reads the
same value to keep the product framed as it grows, and picks up scripted `focusY` /
`focusDist` / `takeControl` when the story is driving. Only the visible numbers (the `%`
readout, the sidebar heading, the story's chapter index) go through state.

> **Convention:** the ref holds a plain mutable object, so every access must go through
> `viewRef.current.X`. Mixing `viewRef.X` and `viewRef.current.X` type-checks, lints
> clean, and silently degrades to `undefined` — which is exactly the bug described above.

The camera re-frames itself from the current explode value, and stops adjusting distance
as soon as the visitor zooms manually — so auto-framing never fights the user.

---

## API

```
GET    /api/health
GET    /api/products              ?category&material&minPrice&maxPrice&search&sort&page&limit
GET    /api/products/filters      distinct categories/materials + price bounds
GET    /api/products/:slugOrId    includes 3 related products
POST   /api/products              admin
PUT    /api/products/:id          admin
DELETE /api/products/:id          admin (soft delete)

POST   /api/auth/register         also claims the guest cart
POST   /api/auth/login            also merges the guest cart
GET    /api/auth/me
PUT    /api/auth/me
POST   /api/auth/logout

GET    /api/cart                  user via JWT, guest via x-session-id
POST   /api/cart
PUT    /api/cart/:itemId
DELETE /api/cart/:itemId
DELETE /api/cart

GET    /api/wishlist              auth required
POST   /api/wishlist/:productId   idempotent
DELETE /api/wishlist/:productId

POST   /api/orders                recomputes all prices server-side
GET    /api/orders/:idOrNumber
GET    /api/orders                own history (auth)
GET    /api/orders/all            admin
PUT    /api/orders/:id/payment-status   admin

POST   /api/contact               stores, and emails if SMTP is configured
GET    /api/contact               admin
```

Notable behaviour:

- **Guest carts** work without an account. The client generates a `sessionId`, keeps it in
  `localStorage` and sends it as `x-session-id`. Registering or signing in claims that
  cart server-side, merging quantities for items already in the account cart.
- **Order totals are never trusted from the client.** `createOrder` re-reads every price
  and re-checks stock from the database, then decrements stock and empties the cart only
  after payment succeeds.
- **Passwords** are bcrypt-hashed on save and the field is `select: false`, so it cannot
  leak through a query by accident. Credential endpoints are rate limited.
- **Deletes are soft** (`isActive: false`) so order history keeps referring to real rows.

---

## Content that still needs the real brand

Everything below is a **placeholder** written to be plausible and internally consistent.
Confirm before shipping — it is the only part of this build that is not real:

- **All specifications.** Thread sizes, diameters, flow rates, gasket ratings, weights and
  the `Certification: NSF/ANSI 372` line in `server/seed/seed.js` are invented. The
  *shape* of the data is right; the numbers are not measurements.
- **The warranty** (5-year mechanism, 2-year finish, 1-year gasket) in
  `client/src/data/content.js` and the FAQs.
- **Shipping terms** — $150 free-shipping threshold, 8 % tax, $12 flat rate. These live
  in three places and should be centralised before launch: `cartController`/`orderController`
  on the server, and `Cart.jsx` / `Checkout.jsx` on the client.
- **Email addresses and the `CONTACT_TO` env var.** The real business contact details
  (address, phone, email) are now in `BUSINESS` at the top of
  `client/src/data/content.js` and are shown in a footer contact strip on every page
  plus the contact page. `CONTACT_TO` on the server is still unset, so contact-form
  submissions currently go nowhere — point it at `BUSINESS.email` (or a real inbox).
- **The newsletter form** validates and confirms locally; there is no mailing-list
  backend, so no data leaves the browser. One line in `NewsletterForm.jsx` to wire it up.
- **The chat bubble** is a self-contained stand-in for a third-party widget (Intercom et
  al) so no vendor script is required to demo the pattern.
- **Payments are mocked.** `paymentMethod: "mock"` marks the order paid and decrements
  stock exactly as a real charge would. The checkout page has a "simulate a declined
  payment" control to exercise the unpaid branch. Swap in Stripe by replacing that branch
  in `orderController.createOrder`; no schema changes are needed.
- **Product photography** does not exist in the brief's data set, and only two of the six
  seeded products ship a 3D model. Those two get a live WebGL thumbnail; the other four get
  **no image at all** — the card keeps its soft ground with the wishlist and quick-add
  controls, and the name, price and rating below do the identifying. Two stand-ins were
  tried and rejected: a generated technical line-drawing, then a typographic panel. Both
  read as filler; the plain card reads better. Real product photography is the proper
  upgrade here.

---

## Deviations from the brief, and why

- **Tailwind v4** via `@tailwindcss/vite` with design tokens in
  `client/src/styles/index.css` under `@theme`, instead of a `tailwind.config.js`. v4
  makes CSS the source of truth for the theme; the v3 config pipeline is deprecated. There
  is no `tailwind.config.js` — the brief's folder listing predates v4.
- **Hotspot markers are DOM, not `<Html>` or raycast-picked empties.** The brief lists
  either as acceptable. Projecting to the DOM keeps them crisp and keyboard-accessible and
  avoids canvas/DOM stacking fights. Hovering a marker still highlights its part in 3D.
- **The cross-section is a runtime clip plane**, not a second asset (see above).
- **The product catalogue page was removed** at the client's request. `pages/Products.jsx`
  and its `/products` route are gone; product detail pages (`/products/:slug`) are
  untouched and still work, including the interactive 3D viewer.
  - Every "shop" call to action — the navbar, the footer columns, and the "browse
    products" buttons on the empty cart / wishlist / checkout / account states — now
    resolves through `SHOP_PATH` in `client/src/data/paths.js`, so there is one place
    to change if the destination moves.
  - `GET /products` is **redirected** to `SHOP_PATH` rather than 404ing, so existing
    bookmarks, shared links and the old `?category=` filter URLs still land somewhere
    useful.
  - The footer's three category links (Drain assemblies / Seals & gaskets / Strainers)
    were filters for the deleted grid and had no meaning left, so they were folded into
    a single **Drain assembly** link. The "Browse products" / "Continue shopping" button
    labels were reworded to *View the product* / *Back to the product* to match their new
    destination, and the product page breadcrumb is now `Home / <product>`.
  - **Consequence worth knowing:** the other five seeded products have no listing page to
    appear on. They are still reachable at `/products/<slug>`, from the admin, and from
    the wishlist, but nothing links to them from public navigation any more.
- **Port 4000**, not 5000 (macOS AirPlay Receiver owns 5000).
- **R3F 9 + React 19**, so the peer versions move together.

---

## Verification

The build was checked in a real browser (headless Chrome over the DevTools Protocol) and
against the live API.

- **Production build passes** with 0 lint errors and 0 runtime errors.
- **26/26 end-to-end checks pass** against the production build: product grid, URL-backed
  filters, add to cart, quantity changes, cart totals ($178 subtotal + 8 % tax =
  **$192.24**, free shipping over $150), checkout validation blocking an empty submit,
  order creation, cart emptying after payment, registration, the admin route guard
  blocking a non-admin, admin login, the admin product/message tabs, the contact form
  POSTing, and all seven static routes rendering.
- **13/13 responsive checks pass** at 414×896: hamburger replaces the desktop nav, the
  drawer opens, the explode slider becomes horizontal, hotspot markers stay on screen, and
  **zero horizontal overflow on any page**.
- **API checks pass** directly: 401 without a token, 403 for a non-admin on an admin
  route, no `passwordHash` in any response, idempotent wishlist, guest-cart claim on
  register, and server-side price recomputation.

Two real bugs were found and fixed by these runs, both invisible in development:

1. **helmet's default CSP silently broke the 3D viewer in production.** It blocks
   `WebAssembly.instantiate`, which three.js needs. `server.js` now sets an explicit CSP
   with `'wasm-unsafe-eval'` plus the Google Fonts origins the client actually uses.
2. **The explode slider was rendered twice** (desktop and mobile) and hidden with
   Tailwind, putting two controls with the same accessible name in the document. There is
   now one slider that switches orientation via `useMediaQuery`.

A third was far more serious, and only surfaced when the scroll narrative was added:

3. **The explode had never actually worked.** The codebase mixed two conventions for the
   shared render-loop ref — some sites read and wrote `viewRef.X`, others
   `viewRef.current.X`. Since `useRef({...})` only puts the object on `.current`, the
   readers were silently getting `undefined` and falling back to `0`. The slider moved a
   number in the UI and the camera zoomed, but **the model never separated** — which is
   exactly the symptom that prompted the scroll work. All 29 access sites now go through
   `.current`, and the convention is called out in a comment where the ref is defined.
   This is worth flagging as a class of bug: it type-checks, it lints clean, and it
   degrades to a plausible-looking default rather than throwing.
4. **The story lagged a beat on the product page.** The scroll damping clamped `dt` to
   50 ms for stability, which made convergence depend on the *frame count* rather than
   wall-clock. On a page with two viewers the frame rate dropped, and after a couple of
   seconds the progress was still a fraction short — enough to sit on the wrong side of a
   chapter boundary. The per-frame cap is now 100 ms and progress snaps once it is within
   0.4 % of the target, so it always settles on the correct beat regardless of frame rate.

Current state: **42/42 desktop checks and 17/17 mobile checks pass with 0 runtime
errors and 0 CSP violations**, covering the cart/checkout maths, the auth and admin
guards, the interactive viewer's explode/cross-section/hotspots, all eight story beats
on all three pages with the stage pinned, one-live-canvas enforcement, and zero
horizontal overflow on every route.

A further 42/42 route checks pass against the bundled server: all seven pages (home,
products, product detail, about, FAQs, contact, cart) render with **0 runtime errors**,
**no horizontal overflow**, the real contact details in the footer strip, and no
placeholder email addresses left anywhere. All 14 chapter-rail labels were measured to
sit inside the viewport at 1500 px.

A horizontal-overflow bug was found and fixed during that pass. On desktop the rail
becomes a column against the right edge, and the chapter label was centred on its dot,
which pushed the page ~20 px wider than the viewport on home, about and the product
page. The label is now anchored to the left of the dot on desktop
(`lg:right-full lg:left-auto lg:mr-2`) and stays centred above it on mobile.

---

## Scripts

**server**

| Command | Description |
| --- | --- |
| `npm run dev` | `node --watch server.js` |
| `npm start` | production start |
| `npm run build` | bundle the API and all dependencies into `dist/server.cjs` |
| `npm run serve:bundle` | run the bundle directly |
| `npm run seed` | wipe and re-seed products, hotspots and the admin user |

**root**

| Command | Description |
| --- | --- |
| `./start.sh` | check MongoDB, seed, build if needed, serve on `localhost:4000` |
| `./start.sh --rebuild` | force a fresh client build and server bundle |
| `./start.sh --dev` | also start the Vite dev server |

**client**

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with `/api` proxied to `localhost:4000` |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the build |
| `npm run lint` | oxlint |
