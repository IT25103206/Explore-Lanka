# Explore Lanka – fix pack (src/main)

## How to apply
1. Copy this `main` folder into your project's `src` folder (so it becomes `src/main/...`) and replace files when asked.
2. **Images/videos are not included** (they're unchanged, ~218 MB). Keep your existing `src/main/resources/static/images/` folder as it is.
3. Stop the app, rebuild, run again, then hard refresh the browser (Ctrl+F5).

No new Maven dependencies are needed.

## What was wrong
The project had two frontends mixed together:
- **Live frontend** – `static/*.html`, `static/admin/*.html`, `static/customer/*.html`, `js/app.js`, `js/pages/*`. This one matches the backend APIs and is what the landing page opens.
- **Old frontend** – `templates/**`, `js/portal.js`, `js/customer-portal.js`, `js/admin-data.js`, `js/admin-auth.js`, `js/customer-*.js`, `js/explore-system.js`. It uses `/ui/*`, `/admin/login`, `/api/auth/session`, `/api/packages` etc., which **don't exist** in the backend, so those pages 404.

Earlier fixes (package image upload, admin login route, UI polish) were applied to the old frontend, so they never showed up.

## What was fixed
| Area | Fix |
|---|---|
| Image upload | New `POST /api/admin/uploads/image` (staff only, JPG/PNG/WEBP/GIF, max 5 MB, real file-type check). Files saved to `uploads/images/` next to the app and served at `/uploads/images/...`. |
| Admin forms | Packages, Events, Promotions and Hotels now have an upload button + preview (you can still paste a URL). Package table no longer shows a broken image when there's none. |
| Old links | `/admin/login` → staff login, `/ui/admin-*` → matching `/admin/*.html`, `/ui/customer-*` → matching customer page (query string kept). No more JSON 404s. |
| UI polish | `ui-polish.css/js` now actually load on admin and customer pages (and wait for the layout to render). |
| Database | Startup migration now converts **all** MySQL ENUM columns to VARCHAR(40), not just `users.role`. Stops "Data truncated for column" when an enum value is added. |
| Errors | Proper messages for file too large (413), missing parameter (400), wrong method (405), wrong format (415) instead of a generic 500. |
| Security | Customer login `?next=` no longer allows redirecting to another site (`//evil.com`). |
| Cleanup | Removed outdated fix notes that described the old frontend, and `.DS_Store`. |

## Files changed / added
- `java/.../common/upload/ImageUploadController.java` (new)
- `java/.../config/WebConfig.java` (new)
- `java/.../config/LegacyRouteController.java` (new)
- `java/.../config/RoleColumnMigration.java`
- `java/.../common/exception/GlobalExceptionHandler.java`
- `resources/application.properties` (upload settings at the bottom)
- `resources/static/js/app.js`, `resources/static/js/ui-polish.js`
- `resources/static/js/pages/admin-packages.js`, `admin-events.js`, `admin-promotions.js`, `admin-resources.js`
- `resources/static/login.html`

## Quick test
1. Staff login → Tour Packages → Add package → choose an image → preview shows → save. The image appears in the table.
2. Open `http://localhost:3000/admin/login` → should land on the staff login page.
3. Upload folder location can be changed with `UPLOAD_DIR` env var. Add `uploads/` to `.gitignore`.

## Note
The old frontend files are still there but unused. Delete `templates/` and the old JS files listed above if you don't need them.

## Interface refresh — 4 October 2026
The live management and customer pages now share a new forest-green, ivory and gold design. This update covers every live portal page, authentication screens, forms, tables, package cards, booking steps, dialogs, profile, notifications and mobile navigation.

Copy the supplied `main` folder into the existing project's `src` folder, allowing file replacements. Stop and rebuild the Spring Boot application, run it again, then press Ctrl+F5 in the browser. The ZIP contains the existing images and videos as well as the updated source files. This is a `src/main` update, not a separate Maven project; keep your current `pom.xml` and Maven wrapper.

The live interfaces are `resources/static/admin/*.html` and `resources/static/customer/*.html`. Do not replace them with the older templates. The shared design lives in `resources/static/css/ui-polish.css` and `resources/static/js/ui-polish.js`, loaded with a new cache version by `app.js`.

Backend Java code, database configuration, API calls, role permissions, IDs used by forms, upload handlers and booking/payment logic are preserved. Dashboard shortcut links use only the pages already permitted by the user's role. Menu controls support Escape, a close backdrop and expanded-state announcements. Motion respects the device's reduced-motion preference; printable invoices retain a clean white layout.

Validation: JavaScript syntax checks passed. Browser rendering was checked at 1440px desktop and 390px mobile widths for 25 main portal pages using sample API responses. Package and partner creation dialogs opened with their existing fields; dashboard navigation opened and closed with Escape. A resource allocation grid overflow found during mobile resizing was fixed and rechecked. Existing Java files are byte-for-byte unchanged. Full Spring Boot startup, database operations, real authentication, saving records and payments were not exercised because this upload contains `src/main`, without the surrounding Maven project or a running database.

## Additional animations
Staggered entrances now run as cards, metrics and table rows enter view, including content loaded after API responses. Buttons show a short ripple and press effect; navigation icons respond on hover; package photos gently zoom and follow the mouse; offers, event dates and metric icons lift on hover. Dialogs, dropdown menus, notifications and login panels have smoother entrances. Dashboard banners have a slow decorative light sweep.

All content remains visible without animation support. The operating system's reduced-motion preference disables effects and cancels active entrance animations; printing also cancels them. No numeric values, API requests or form handlers are rewritten for animation. The shared assets use a fresh cache version.

Animation validation: on management allocation/dashboard and customer dashboard pages, browser checks confirmed dynamic entrance animations, button ripple creation/removal and live reduced-motion cancellation, with no JavaScript errors or desktop/mobile page overflow. Existing menu open/Escape-close checks passed. Checks used sample API responses.
