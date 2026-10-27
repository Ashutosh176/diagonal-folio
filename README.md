# D/F — The Diagonal Folio

Luxury leather goods store for **Taglio DF-01** (convertible briefcase), **Cadre DF-02** (frame bag), **Orlo DF-03** (top-handle bag), **Lama DF-04** (ladies' top-handle bag), **Piega DF-05** (structured tote) and **Fibbia DF-06** (weekender).
React (Vite) client plus a Node/Express API. The design follows *Diagonal Folio Store v2*. Product specs come from the tech packs and look sheets in `docs/reference/`.

## Run it

```bash
npm install          # installs root, client and server workspaces
npm run dev          # API on :5174, site on http://localhost:5173
```

Production: `npm run build && npm start` serves the built site and the API from one Node process on `PORT` (default 5174).

## Structure

```
assets/originals/     source renders (2000–2400 px) — add or replace product photos here
scripts/              optimize-images.mjs → responsive WebP (640–2400 px) + full-quality JPEG
client/               React app
  src/pages/          Home, Collection, Product, Checkout, OrderConfirmed, Appointments,
                      House, Personalisation, ClientCare, NotFound
  src/components/     Header, Menu/Search/Bag overlays, Footer, Img (srcset), Reveal
  src/config.js       phone, email, delivery days, returns window, social links
  public/brand/       SVG logos and monograms
server/
  src/catalog.js      products, colourways, specs, materials, prices
  src/index.js        REST API
  data/               JSON storage for orders, subscribers, appointments and enquiries (git-ignored)
docs/reference/       tech packs, look sheets, naming guide
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/products`, `/api/products/:slug` | Catalogue |
| POST | `/api/orders` | Place an order. Prices are recomputed on the server. |
| GET | `/api/orders/:id` | Order status (confirmation and tracking) |
| POST | `/api/newsletter` | Atelier letters and the shoes first-access list |
| POST | `/api/appointments` | Private appointment requests |
| POST | `/api/contact` | Client-care enquiries |

## Updating images

Put the new file in `assets/originals/` (same name to replace it), then run `npm run images`.
Product image names are listed in each colourway's `images` array in `server/src/catalog.js`.

### Brand film (not on the site at the moment)

The film was the home hero before the 3D opening replaced it. It is a 17-second loop built from the Taglio and Cadre renders: the gold monogram, the Taglio clasp, the Taglio, the Cadre slash-lock and the Cadre. Each shot moves slowly, a light sweep at 15° crosses the brass, and the cut is graded warm with grain and fades through black.
`npm run film` rebuilds `client/public/video/hero-wide.mp4` (1920×1080) and `hero-tall.mp4` (1080×1920, for phones), each with a poster JPEG. It needs ffmpeg on the PATH.
Shots, timings and moves are listed in `SHOTS` in `scripts/make-hero-film.mjs`. Visitors who prefer reduced motion or save data see the poster only.

### Home-page 3D opening

The home page opens on the Taglio in real-time 3D (three.js), on a deep espresso stage with a warm cognac glow and fine grain.
Scrolling turns it through five chapters: the house, the 15° cut, a close-up of the engraved clasp, the trolley sleeve, and the gusset, then a call to action.
The model is built in code from the tech-pack dimensions in `client/src/three/taglioScene.js`, with leather, stitching and engraving textures drawn on canvases. Overlapping parts are kept slightly apart so no two surfaces flicker against each other.
The bag stands on a black-lacquer mirror floor under a spotlight that follows it, inside a hairline vitrine frame with a gold chapter counter. On arrival the bag assembles itself from its parts. In the anatomy chapter it comes apart into an exploded view, with labels that track each part. Gold dust drifts at different depths, a giant outlined TAGLIO and a gold 15° line slide past at their own speeds, and the camera and every layer lean towards the pointer.
Rendering quality: it is lit by a custom studio environment (softbox, strip lights, bounce card) and tone-mapped with Khronos PBR Neutral so the colours stay true. The pebbled calf uses a 1K pebble grain whose tops are smoother, the box calf has a fine grain and a mottled glaze, the stitches are real geometry at 7 per inch, and the brass is brushed (anisotropic). The canvas renders at up to 2× pixel density while the scroll rests and drops to 1.25× while it moves.
Poses and copy are set in `KEYS` and `CHAPTERS` in `client/src/components/BagStory.jsx`. In development, add `#nosmooth` to the URL to snap straight to each pose.
three.js loads as a separate chunk after first paint, with a studio render that cross-fades out once the model is drawn.

### Logo corrections on the renders

In 11 renders the engraved D/F on the metal plate came out broken or missing (the Cadre turn-lock and the Taglio push-clasp).
`scripts/fix-plate-logos.mjs` removes the broken marks and engraves the exact D/F from `DF_monogram_noir.svg` onto each plate in perspective.
It changes only plate pixels and saves at JPEG quality 96 with 4:4:4 colour.
The untouched renders are kept in `assets/source-renders/`, and the script always starts from those.
If a render is replaced with a new one, remove that file's entry from `PLATES` in the script.

## Before launch

- **Prices**: ₹64,000 (Taglio), ₹89,000 (Cadre), ₹72,000 (Orlo), ₹58,000 (Lama), ₹68,000 (Piega) and ₹1,15,000 (Fibbia) are placeholders. Set the real prices in `server/src/catalog.js`.
- **House details**: fill the `TODO` values in `client/src/config.js` (phone, WhatsApp, email, delivery days, returns window, shoe season, social links). Express delivery is charged in both `config.js` and `server/src/index.js`.
- **Payments**: orders are saved as `awaiting_payment`. The next step is a gateway such as Razorpay, plus a webhook that marks orders paid.
- **Images**: the product images are 3D renders. Replace them with studio photography when it's ready.
- **Storage**: swap the JSON files for a database (Postgres or MongoDB), and add email notifications and an admin view.
