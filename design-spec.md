# Recipe Website Design Spec

**Status:** Design phases complete. This is the concise reference for implementation. The application uses the Auth0 Next.js SDK, and scaled ingredient amounts are rounded to three decimal places with trailing zeroes removed.

## Product and access

- The site is a personal recipe collection and portfolio project.
- All recipes are public. Visitors can browse, search, and scale them without an account; they cannot create, edit, delete, comment, or rate.
- One owner can create, edit, and delete recipes. Owner controls appear only after sign-in, and every write request must be authorized on the server.
- No servings, description, prep time, or cook time in the first release.

## Recipe model

- Required: title, at least one ingredient, and instructions.
- Optional: tags and one photo.
- Each ingredient has a name, numerical amount, and unit. Amounts accept fractions and decimals and are treated as numeric values for scaling.
- Instructions are entered as separate steps and numbered automatically.
- The owner can select existing tags or create a new one.
- Ingredient matching ignores capitalization, spaces, and hyphens while preserving the entered name for display. Variations and synonyms are out of scope.

## Search and scaling

- One search form has an optional title query, a multi-select tag dropdown, repeatable **Include all** ingredient fields, and repeatable **Exclude any** ingredient fields.
- Every typed title word must appear somewhere in the title; word order does not matter.
- All entered filter groups narrow the same results. Every selected tag and included ingredient must match; a match for any excluded ingredient removes the recipe.
- Ingredient search compares only names recorded on the recipe. It does not account for synonyms, sub-ingredients, or cross-contact and must not be described as an allergy-safety guarantee.
- Matching cards appear below the form on the same page. No matches produce an empty results list; errors explain their cause beside the relevant controls.
- The recipe detail scaler starts at 1× and accepts positive numbers, including decimals. It changes displayed ingredient amounts only; units and saved recipe data remain unchanged. Scaled values round to at most three decimal places, omit trailing zeroes, and show `<0.001` when a positive value rounds to zero.

## Pages and flows

- **Recipe list:** A single vertical list of cards showing thumbnail (or quiet placeholder), title, and tags. The owner sees a **Create** button only while signed in. Desktop cards place the thumbnail beside the text; phone cards stack image above text.
- **Search/results:** Title and tag controls sit side by side on desktop and stack on phones. Ingredient include/exclude groups follow. Results use the same cards and appear below the controls.
- **Recipe detail:** A narrower reading column shows title and tags, ingredients with multiplier, numbered instructions, then the optional photo. Owner-only Edit/Delete controls sit near the title. Returning from search restores criteria and result position.
- **Create/edit form:** One column ordered title, tags, photo, ingredient rows, instruction steps, then Save and Cancel. Uploading a photo shows a preview; an existing photo can be replaced or removed. Save returns to the recipe detail page. Canceling with unsaved changes asks for confirmation. Form errors explain the issue and retain entered values.
- **Delete:** Delete is available from recipe detail. Confirmation names the recipe; confirm returns to the list, cancel returns to the detail page.
- **Owner sign-in:** A footer **Owner sign in** link opens Auth0 Universal Login for one pre-created owner account, with public sign-up disabled. Successful sign-in returns to the recipe list in owner mode; logout returns to public mode. Framework-specific SDK, callback, and session setup follows stack selection.

## Visual and accessibility direction

- Warm editorial cookbook style: warm cream background (`#F7F4EC`), forest-green primary controls (`#294334`), restrained terracotta accents (`#A64F35`), serif headings, and sans-serif body text.
- Keep the layout clean and content-focused, with comfortable spacing and prominent recipe photos where available.
- Controls need clear labels, keyboard operation, visible focus, readable text, and sufficient contrast. Show errors beside the relevant fields.

## Photo storage and upload constraints

- Store one recipe photo in a public Supabase Storage bucket named `recipe-photos`; public access matches the public recipe pages.
- Accept JPEG, PNG, and WebP files up to 3 MiB. Validate the declared type and file signature on the server.
- Store each upload at a generated, immutable path. Keep that path and required screen-reader description (up to 250 characters) with the recipe row.
- Upload, replace, and remove images only through owner-checked Next.js server actions. The browser never receives the Supabase secret key.
- Replacing or removing a photo updates the recipe record before deleting the old storage object, so failed recipe saves keep the current photo available.

Ingredient exclusions use recorded recipe data only; FDA guidance notes that allergy risks can also involve undeclared cross-contact ([FDA food allergy guidance](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies)).
