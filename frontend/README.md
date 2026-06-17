# Cutwise IMS — Sales Module (Frontend)

Frontend-only React (Vite) implementation of the leather sales module described in the
project spec. No backend calls — all data lives in `src/data/mockLeather.js` and in
local/context state.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

To produce a production build:

```bash
npm run build
npm run preview
```

## Pages

- `/` — Dashboard (KPIs, sales-by-type bar chart, revenue-share donut chart, recent sales table)
- `/sales` — Leather Catalog (search, type filters, material grid, sticky cart bar)
- `/sales/:materialId` — Leather Detail / Sale Entry (batch picker, quantity, fulfillment, hide inventory table)
- `/manage-leather` — Manage Leather (add-batch form with live valuation/margin preview, recently-added table)

## Notes

- Currency is formatted as PHP (₱) throughout.
- The leather texture image is a single shared placeholder asset; per-material variety
  comes from a CSS colour-tint overlay (`material.tint`) rather than separate photos.
- Cart, fulfillment method, and the order-summary modal are all driven by `CartContext`
  so state stays in sync between the Catalog, Detail, and Modal.
- This is a UI-only prototype: form submissions, "Save Sale", and "Save Leather Entry"
  update local state only and are not persisted to a server.
