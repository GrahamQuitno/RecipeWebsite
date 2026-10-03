# Implementation Checklist

Track each phase here as implementation progresses.

## Decisions

- Application stack: TypeScript + Next.js.
- Deployment target: Vercel.
- Database and photo storage: Supabase (Postgres + Storage).
- Sign-in: Auth0 Universal Login using the Next.js SDK; one pre-created owner account and public sign-up disabled.
- Authorization: All database writes and photo uploads/changes go through the Next.js server, which checks that the signed-in Auth0 user is the owner.
- Supabase access: Keep credentials server-side in Vercel environment variables; do not expose them to the browser. Defer Supabase's Auth0 JWT/RLS integration.

- [x] **1. Choose the foundation**
  - Stack, hosting, storage, sign-in, and authorization approach recorded above.
- [x] **2. Build the public recipe experience**
  - Create the application shell and recipe data model.
  - Add sample recipes.
  - Build responsive recipe list and detail pages.
- [x] **3. Add search and scaling**
  - Implement title, tag, include-ingredient, and exclude-ingredient filters.
  - Match ingredients using the rules in the design spec.
  - Add the detail-page multiplier and define amount parsing and display formatting.
  - Preserve search criteria when returning from a recipe.
- [ ] **4. Add owner editing**
  - Set up sign-in for the single owner.
  - Add create, edit, and delete flows for recipes.
  - Enforce owner authorization on every server-side write.
  - Application code and the database schema are in place; Auth0 and Supabase still need project credentials and dashboard setup before this phase is operational.
- [ ] **5. Add photos and finish the flows**
  - [x] Add photo upload, preview, replace, and remove.
  - [x] Complete validation, confirmation, and error states.
  - [x] Review accessibility and add deployment settings and setup guidance.
  - Apply the updated Supabase schema and configure the project credentials and Vercel environment before considering this phase operational.
