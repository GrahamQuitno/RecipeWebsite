# Implementation Checklist

Track each phase here as implementation progresses.

- [ ] **1. Choose the foundation**
  - Choose the application stack and deployment target.
  - Choose the database and photo storage approach.
  - Decide how Auth0 sessions and callbacks will work for the chosen stack.
- [ ] **2. Build the public recipe experience**
  - Create the application shell and recipe data model.
  - Add sample recipes.
  - Build responsive recipe list and detail pages.
- [ ] **3. Add search and scaling**
  - Implement title, tag, include-ingredient, and exclude-ingredient filters.
  - Match ingredients using the rules in the design spec.
  - Add the detail-page multiplier and define amount parsing and display formatting.
  - Preserve search criteria when returning from a recipe.
- [ ] **4. Add owner editing**
  - Set up sign-in for the single owner.
  - Add create, edit, and delete flows for recipes.
  - Enforce owner authorization on every server-side write.
- [ ] **5. Add photos and finish the flows**
  - Add photo upload, preview, replace, and remove.
  - Complete validation, confirmation, and error states.
  - Review accessibility and finish deployment setup.
