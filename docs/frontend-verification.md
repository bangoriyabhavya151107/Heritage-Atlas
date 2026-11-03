# Frontend dependency and map verification

Verified for Heritage Atlas Phase 3 on 2026-11-01 against the official documentation and npm registry. These notes preserve the specific constraints used in the implementation.

## Next.js dynamic imports

The Next.js App Router lazy-loading guide states that `ssr: false` is supported only for Client Components; it is not supported in Server Components. The Leaflet import therefore lives in the client-side `LocationPicker` module and uses `next/dynamic` with `ssr: false`.

Source: https://nextjs.org/docs/app/guides/lazy-loading

## React Leaflet and Leaflet

The React Leaflet installation guide lists React, React DOM, and Leaflet as peer dependencies, and says TypeScript projects also need Leaflet type definitions. Its map API documents `MapContainer`, `useMap`, and `useMapEvents`; the map listener uses the documented `click` event. Leaflet CSS is loaded from the root layout.

Sources:
- https://react-leaflet.js.org/docs/start-installation/
- https://react-leaflet.js.org/docs/api-map/
- https://react-leaflet.js.org/docs/start-setup/

## OpenStreetMap standard raster tiles

The map uses the standard HTTPS tile URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with visible “© OpenStreetMap contributors” attribution and a report-map-issue link. The official policy says normal interactive viewing is permitted, requires attribution, and prohibits bulk prefetch/offline downloading. The app does not prefetch tiles or set restrictive referrer headers. Tile URL is configurable by `NEXT_PUBLIC_OSM_TILE_URL` for later provider changes.

Source: https://operations.osmfoundation.org/policies/tiles/

## Tailwind CSS

The official Next.js guide documents Tailwind v3 setup with a Tailwind configuration file and global directives. Tailwind v3 was selected so the requested design tokens remain in `tailwind.config.js`, rather than using the Tailwind v4 CSS-only theme syntax.

Sources:
- https://nextjs.org/docs/app/guides/tailwind-v3-css
- https://tailwindcss.com/docs/theme

## Versions checked in the npm registry

`pnpm view` returned these exact versions and peer ranges before installation:

- Next.js 16.4.3; peer React range `^18.2.0 || ^19.0.0`.
- React and React DOM 19.3.1.
- React Leaflet 5.0.0; peer range React/React DOM `^19.0.0`, Leaflet `^1.9.0`.
- Leaflet 1.9.4; `@types/leaflet` 1.9.22.
- Tailwind CSS 3.4.19; PostCSS 8.5.32; Autoprefixer 10.6.2.
- TypeScript 5.9.3, ESLint 10.14.0, `eslint-config-next` 16.4.3, Zod 4.6.7.

Registry pages: https://www.npmjs.com/package/next, https://www.npmjs.com/package/react-leaflet, https://www.npmjs.com/package/leaflet, https://www.npmjs.com/package/tailwindcss, https://www.npmjs.com/package/eslint
