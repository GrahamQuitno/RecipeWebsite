# Implementation Notes: Recipe Journal

This document records the project decisions and code implemented so far. It is meant to be a learning guide as well as a progress record.

## Current status

- Phase 1, **Choose the foundation**, is complete.
- Phase 2, **Build the public recipe experience**, is implemented and checked off in `implementation-checklist.md`.
- Phase 3, **Add search and scaling**, is implemented and checked off in `implementation-checklist.md`.
- Phase 4 owner editing is implemented in the app, but its checklist remains open until Auth0 and Supabase are configured with your project credentials.
- Phase 5 photo handling and flow finishing are implemented in the app. Its code tasks are checked off; the phase remains open until the updated Supabase schema is applied and the project and Vercel environment are configured.
- The last commit is `47aafc6` (`Phase 2 of implementation`); the Phase 3 through Phase 5 changes, checklist/design updates, and this document are local and uncommitted.
- The initial Next.js starter was deployed to Vercel. The Phase 2 commit is on GitHub; if Vercel is linked to this repository and configured to use `web` as its Root Directory, it should build a deployment from that commit. The deployment status was not checked while writing these notes.
- Without Supabase environment variables, public pages keep using the five local sample recipes. With Supabase configured, the app reads saved database rows; the database starts empty until you create recipes.
- The lint and build commands were not run after the Phase 5 changes. Installing the SDK packages earlier reported five high-severity dependency advisories; no automatic dependency upgrades were applied.

## Foundation decisions from Phase 1

The project uses **TypeScript and Next.js** for the application, **Vercel** for hosting, **Supabase Postgres and Storage** for recipe data and photos, and **Auth0 Universal Login** for the single owner account.

The security shape is that public visitors can read recipes and photos, while recipe changes and photo uploads go through the Next.js server. The server checks that the signed-in Auth0 user is the owner before writing to Supabase. Supabase credentials stay on the server in Vercel environment variables. The implementation defers connecting Auth0 tokens directly to Supabase row-level security.

Those choices are recorded now so the app can be built in stages. Choosing a service does not mean it has been configured or connected yet.

## What Phase 2 implements

Phase 2 turns the generated Next.js starter page into a public recipe collection:

- A shared site header, footer, and page shell.
- A responsive, vertical list of recipe cards with tags and decorative image placeholders.
- Five sample recipes with ingredients and instructions.
- A detail page for each recipe, with tags, ingredients, and automatically numbered instructions.
- A warm cream, forest-green, and terracotta color palette, serif headings, mobile layouts, keyboard focus styles, and a skip-to-content link.

The card artwork is drawn with CSS shapes. It acts as a quiet placeholder until real photos are added; it is not stored recipe photography.

## What Phase 3 implements

Phase 3 adds search and scaling while recipes still come from the local TypeScript fixture:

- Search by title words, one or more tags, ingredients that must all be present, and ingredients that must be absent.
- A matching recipe must contain every search word, selected tag, and included ingredient. Any excluded ingredient removes the recipe.
- Ingredient matching lowercases names and removes spaces and hyphens before checking whether a saved ingredient name contains the entered term. It only checks recipe data; it does not check synonyms, sub-ingredients, or cross-contact.
- Search values are stored as URL query parameters. This makes filtered collection URLs shareable and keeps the filters when a visitor opens a recipe. The recipe card also remembers the collection scroll position for the return link.
- Recipe detail pages have a positive-number multiplier, starting at 1×. It changes displayed amounts in the browser without mutating the recipe data.
- Scaled amounts are rounded to three decimal places and trailing zeros are omitted. A positive amount too small to show at that precision appears as `<0.001`.
- The search controls and multiplier are small Client Components because they need interactive state. Recipe matching and page rendering happen in Server Components.

## What Phase 4 implements

Phase 4 adds the owner editing code and database layout while keeping recipes public to read:

- Auth0 Universal Login is wired through the Auth0 Next.js SDK. The Next.js 16 `proxy.ts` file lets the SDK manage login, callback, logout, and session cookies.
- The footer shows an owner sign-in link when Auth0 is configured. Once the current Auth0 user's `sub` matches `AUTH0_OWNER_ID`, the site shows owner controls.
- The owner can create recipes from the collection page, edit a recipe from its detail page, and delete it after a confirmation that names the recipe.
- Recipe fields include a title, existing tags, new comma-separated tags, repeatable ingredient rows, and repeatable instruction steps. Amount input accepts decimals, ASCII fractions, mixed fractions, and common Unicode fraction glyphs.
- Server Actions validate submitted values and repeat the owner check before every save or delete. Hiding the controls on a page is only a user-interface choice; it is not the security boundary.
- A server-only Supabase client reads and writes with `SUPABASE_SECRET_KEY` or the legacy server-only `SUPABASE_SERVICE_ROLE_KEY`. The key is never sent to browser code.
- `web/supabase/schema.sql` creates recipe, ingredient, instruction, tag, and recipe-tag tables. Row Level Security is enabled without public policies. Recipe saves use a database function so a recipe and its child rows update in one transaction.
- If Auth0 or Supabase credentials are missing, the public sample collection remains usable and the owner setup page explains what is needed. This workspace has not applied the schema to a live Supabase project.

## What Phase 5 implements

Phase 5 adds public recipe photos and finishes the editor flows:

- The recipe editor accepts JPEG, PNG, and WebP images up to 3 MiB. The server checks the size, MIME type, and file signature before uploading.
- The editor shows a local preview, supports replacing or removing an existing image, and asks for useful alternative text up to 250 characters. Recipe cards and detail pages render stored photos, falling back to the decorative artwork when there is no photo.
- Upload, replace, and remove operations run through the owner-checked Server Action. The Supabase secret remains server-only. Uploaded files use generated immutable paths in the public `recipe-photos` bucket.
- Recipe rows store the storage path and alternative text. The SQL save function updates those fields with the recipe; the action cleans up a newly uploaded object if the database save fails and removes an old object after a successful replacement or removal. Deleting a recipe also attempts to remove its photo. A storage cleanup error can leave an unused object, but does not undo a saved recipe change.
- `web/supabase/schema.sql` creates or updates the public photo bucket with its MIME and size restrictions, adds public read access, and grants no browser write policy. Existing recipe databases gain the two photo columns when the script is rerun.
- Next.js accepts optimized images only from the configured Supabase project's recipe photo path. The Server Action request limit is set to 4.4 MB; the 3 MiB file cap leaves room for recipe fields and multipart overhead under [Vercel Functions' 4.5 MB request cap](https://vercel.com/docs/functions/limitations).
- Cancel asks before discarding edits. Existing named delete confirmation and the editor's retained field values on validation errors remain in place. Photo descriptions, field labels, focus states, and upload errors are included for keyboard and screen-reader use.
- The owner setup page explains the public photo policy and asks for `SUPABASE_URL` in the Vercel build environment. This project has not applied the SQL or configured a live Supabase or Vercel project.

## How the code is organized

The Next.js application lives in `web/`, separate from the design and planning documents at the repository root. Vercel should use `web` as the project's Root Directory because that is where the app's `package.json` lives.

| File | Role |
| --- | --- |
| `web/app/layout.tsx` | The root layout shared by every route. It sets page metadata, the shared header and footer, and the main content area. |
| `web/app/page.tsx` | The home route (`/`). It reads the recipe collection and renders the introduction and recipe list. |
| `web/app/recipes/[slug]/page.tsx` | A dynamic detail route. A URL such as `/recipes/sunday-tomato-pasta` selects the recipe whose slug matches. |
| `web/lib/recipes.ts` | TypeScript recipe and ingredient types, five sample recipes, and a lookup helper. |
| `web/lib/recipe-search.ts` | Search filter types, URL parameter parsing/serialization, ingredient normalization, and filtering logic. |
| `web/lib/ingredient-amount.ts` | Consistent three-decimal formatting for displayed ingredient amounts. |
| `web/lib/auth0-client.ts` and `web/lib/owner-auth.ts` | Auth0 SDK client, current-owner lookup, and the server-side owner gate. |
| `web/proxy.ts` | Auth0's Next.js 16 request boundary for sign-in and session handling. |
| `web/lib/supabase-admin.ts` | Server-only Supabase client using a secret key with browser session persistence disabled. |
| `web/lib/recipe-data.ts` | Recipe reads, tag reads, and persistent save/delete functions; uses sample fixtures until Supabase is configured. |
| `web/lib/recipe-photos.ts` | Server-only photo type/signature/size validation, upload, and storage cleanup. |
| `web/app/actions/recipes.ts` | Server Actions for validated recipe save and delete operations. |
| `web/supabase/schema.sql` | Tables, constraints, RLS settings, and the transactional `save_recipe` database function. |
| `web/next.config.ts` | Server Action upload size and the allowlist for images in the configured Supabase photo bucket. |
| `web/app/owner/recipes/new/page.tsx` and `web/app/recipes/[slug]/edit/page.tsx` | Owner-only create and edit pages. |
| `web/components/recipe-editor-form.tsx` and `delete-recipe-form.tsx` | Interactive owner form, pending/error states, and named delete confirmation. |
| `web/app/owner/setup/page.tsx` and `web/.env.example` | External Auth0/Supabase setup guide and environment variable template. |
| `web/components/recipe-search-form.tsx` | Interactive search form with repeatable ingredient fields and a tag picker. |
| `web/components/recipe-card.tsx` | A reusable recipe card. Its link carries the active search query to the detail route. |
| `web/components/collection-recipe-link.tsx` and `restore-collection-scroll.tsx` | Save and restore the collection's scroll position when opening and returning from a recipe. |
| `web/components/recipe-ingredient-list.tsx` | Interactive multiplier and scaled ingredient list on detail pages. |
| `web/components/recipe-tags.tsx` | A shared tag-list component used on cards and detail pages. |
| `web/components/recipe-artwork.tsx` | CSS-based decorative artwork for cards without photos. |
| `web/components/site-header.tsx` and `site-footer.tsx` | Shared site navigation and footer. |
| `web/app/globals.css` | Color tokens, typography, layout, responsive rules, and focus/reduced-motion styles. |

## Key concepts in the implementation

### Routes come from folders

Next.js App Router maps files under `app/` to URLs. `app/page.tsx` is `/`. A folder named `[slug]` creates a dynamic route segment, so `app/recipes/[slug]/page.tsx` handles each recipe URL. The detail page reads the route's `slug`, looks up the matching sample, and calls Next.js `notFound()` when there is no match.

The detail page also exports `generateStaticParams()` to list the known sample slugs. It now reads `searchParams` to preserve the collection filters in its return link; Next.js treats that request-time value as dynamic, so detail pages render with the incoming URL when requested. In this installed Next.js version, route `params` and `searchParams` are asynchronous, so the page awaits them before looking up the recipe and rebuilding the return URL.

### TypeScript describes the recipe data

`Recipe`, `RecipeIngredient`, and `RecipePhoto` define the shape of the data. An ingredient has a numeric `amount`, a `unit`, and a display `name`. Keeping the amount numeric lets the Phase 3 scaler multiply quantities without parsing display text. Instructions are an array of strings; the page numbers them from their position in the array.

The `photo` field is optional and includes dimensions, alt text, and (for stored photos) the storage path. The current samples have no photos, so cards use decorative placeholders. `web/next.config.ts` builds the image host allowlist from the server-side `SUPABASE_URL` value.

### Components keep repeated UI consistent

The recipe list and detail page both show tags, so they share `RecipeTags`. The list uses `RecipeCard` once for every sample. This keeps the appearance and behavior consistent and gives each piece of UI a clear job.

The pages are Server Components by default. The home page awaits Next.js 16's asynchronous `searchParams`, loads recipes through the server data layer, filters them on the server, and passes the current filters to the search form. The form is a Client Component because add/remove ingredient controls and tag checkboxes need state. The multiplier is also a Client Component because the amount display changes as the visitor types.

### URL parameters preserve search state

The search form uses a normal GET submission. One-time values such as the title use a single query parameter, while repeatable values such as tags and ingredient terms use repeated parameters. For example, `/?title=lemon&include=flour&include=milk` can be bookmarked and opened directly. Recipe links carry those same filters; the detail page rebuilds the return link from them.

### Filtering uses small, predictable rules

`filterRecipes` applies each active filter to the same recipe. Title terms are checked without depending on word order. Every selected tag must be on the recipe. Every include term must match a saved ingredient name, while a match for any exclude term removes the recipe. Ingredient normalization ignores capitalization, spaces, and hyphens before checking for a text match. It deliberately does not guess synonyms.

### Scaling keeps the fixture unchanged

The ingredient list multiplies each numeric amount only for display. It never writes back to `recipes`, so changing the multiplier cannot alter data used by other pages. The formatter rounds to at most three decimal places, removes unnecessary zeroes, and uses `<0.001` for a positive value that would otherwise display as zero.

### Owner checks happen inside every write

`requireOwner()` reads the Auth0 session and compares `session.user.sub` with `AUTH0_OWNER_ID`. Both recipe Server Actions call it directly before parsing or writing form data. The create and edit pages also call it before showing forms, but those page checks only control navigation and visible UI; a caller could invoke a Server Action directly, so the action's own check is essential.

Supabase access is confined to server-only modules. The secret key bypasses Supabase RLS, so it must remain on the server; RLS without public policies prevents browser clients from reading or changing the tables. The app makes the owner decision in Next.js and uses Supabase only from server-side data access and Server Actions, following the Phase 1 choice to defer Auth0 JWT-to-RLS integration.

### Recipe saves are one database transaction

The editor submits form data to a Next.js Server Action. The action parses decimal and fraction amounts, checks required fields and length limits, normalizes tags, and passes structured data to the `save_recipe` SQL function. That function inserts or updates the recipe, replaces its ingredients, instructions, and tags, then returns the saved ID and slug. PostgreSQL runs the function as a transaction, so the recipe cannot be left with only some of its new rows if a later insert fails. Deleting a recipe relies on foreign-key cascade for its ingredients, steps, and tag links.

### CSS adapts the design to screen size

The global stylesheet defines the palette once with CSS custom properties. Cards place artwork beside text on wider screens and stack artwork above text on narrow screens. The recipe detail layout changes from two columns to one. Visible keyboard focus, semantic headings/lists, photo alt text, and reduced-motion handling are included in the shell and styles.

## What is not connected yet

This workspace has not applied `web/supabase/schema.sql` to a live project or configured Auth0, Supabase, and Vercel credentials. Until those external setup steps are complete, public pages continue to use the local sample recipes and owner editing remains unavailable. Once configured, saved recipe records and photos come from Supabase; the SQL script also provisions the public photo bucket.

## Next implementation phases

1. **Finish Phase 4 setup:** configure Auth0 for the one owner, apply the database schema, and set the Auth0 and Supabase values in local and Vercel environments.
2. **Finish Phase 5 setup:** rerun the updated schema to create the photo bucket, set `SUPABASE_URL` in Vercel's build environment, and redeploy.

## Useful commands while learning

Run these from the app directory:

```sh
cd web
npm run dev
```

Then open `http://localhost:3000`. The project also defines `npm run lint` and `npm run build`; neither was run after the Phase 5 changes. There is no test script in `web/package.json` yet.

After a change is ready, check Git status, commit it, and push the branch to GitHub. With the repository connected, Vercel can build a new deployment from the pushed commit. For this repository layout, remember to deploy from the `web` directory.

## Portfolio summary

An accurate short description of the work so far is:

> Built a responsive recipe catalog with TypeScript and Next.js App Router, including URL-backed search, ingredient scaling, Auth0 owner-only recipe editing, and server-side Supabase workflows for recipes and photos. Live Auth0 and Supabase credentials and schema setup are still required to connect the project.
