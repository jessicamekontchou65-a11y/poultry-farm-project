# Farms & shops map (OpenStreetMap)

PoultryHub shows the position of farms and shops on an OpenStreetMap map, built with Leaflet (`leaflet`, `react-leaflet`). No API key is needed.

## Where positions come from

- Farms and shops store `coordinates: { latitude, longitude }` (already in the schema).
- Owners set them with the **location picker**: "Use my current position" (phone GPS), a tap on the map, dragging the pin, or typing the numbers.
  - Farmers: in the "Create farm" form, and on each farm's page (`/dashboard/farmer/farms/[id]`, "Position on the map").
  - Shopkeepers: in the "Create shop" form, and with "Set map position" on each shop in `/dashboard/shopkeeper/shops`.
- The API validates coordinates (`apps/api/src/common/coordinates.ts`): latitude −90…90, longitude −180…180, rounded to about 1 m.
- Listings without a saved position are placed at their city or region centre, spread by 1–4 km so they do not stack, and flagged **approximate** (dashed pin, no directions button).

## Pages

| Route | Who | What |
|---|---|---|
| `/map` | Everyone | Approved, active farms and shops; filter by type, region and name; "Near me" sorts by distance; popups with phone, page link and OpenStreetMap directions |
| `/farms/[id]`, `/shops/[id]` | Everyone | Small map with the exact position and a directions link (only when a position is saved) |
| `/dashboard/admin?tab=map` | Admins | Every farm and shop, including pending and rejected ones, with owner names |

## API

| Method & path | Access | Returns |
|---|---|---|
| `GET /api/map/locations?type=farm\|shop&region=` | Public | Approved and active listings: name, type, place, phone, position, `approximate` |
| `GET /api/admin/map/locations?type=&region=` | Admin | All listings, plus `verificationStatus`, `status`, `ownerName` |

## Privacy

Only approved, active listings are public, and only the business details already shown on their public pages (name, place, business phone). Owners choose the point they publish and can remove it at any time ("Remove", then "Save position").

## OpenStreetMap usage

Tiles come from `tile.openstreetmap.org` with the required attribution. That service is meant for light use; if traffic grows, switch `OSM_TILES.url` in `src/app/components/map/geo.ts` to a dedicated tile provider or a self-hosted tile server.
