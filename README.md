# nagarkaval
Smart Multi-Intersection Traffic Flow and Emergency Priority Routing System optimizes routes for emergency vehicles by analyzing traffic conditions and coordinating multiple signals. It predicts arrival times, creates green corridors, and dynamically reroutes vehicles when congestion occurs, reducing delays and improving emergency response time.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/094ace45-6594-4a77-8271-a7b07aacf2d4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env` and `server/.env` files with your keys (never commit these!):
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `FEATHERLESS_API_KEY`
   - `GOOGLE_ROUTES_API_KEY`
3. Run `npm run check-env` to verify environment setup.
4. Run the app:
   `npm run dev:all`

## Manual Test Checklist
1. **Google Maps Fallback**: Start the app without a Maps key. Verify the UI handles the `gm_authFailure` and automatically displays the error message, guiding users to use Schematic View.
2. **AI Provider**: Check that the Dashboard and Junctions screens show "AI-generated" when keys are present, and "Auto-generated (template)" when missing/invalid.
3. **Route Integration**: Confirm internal fallback works when `ROUTES_PROVIDER` is missing or set to `internal`.
4. **Secrets**: Verify `check-env` prints status but NEVER values. Check `SettingsScreen` to ensure the map key is masked.
