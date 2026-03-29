# PWA Homescreen Icon Fix - TODO Steps

## Plan Breakdown:
1. ✅ [Complete] Create TODO.md with steps.
2. ✅ Update index.html:
   - Cache-bust icon references (add ?v=2).
   - Add explicit <link rel="manifest" href="/manifest.json">.
   - Align title/description if needed.
3. ✅ Update vite.config.ts:
   - Cache-bust icon src in manifest (add ?v=2).
   - Align manifest name/short_name/description to \"Recyclage\".
4. 🔄 [Optional] Generate optimized icons (192x192.png, 512x512.png, maskable) from JPG.
5. 🔄 Test:
   - Run `npm run dev`.
   - Hard refresh, clear cache.
   - Check /manifest.json.
   - Test add to homescreen in Chrome/Safari.
6. ✅ [Complete] Update TODO.md on completion.
7. ✅ Attempt completion.

**Progress: 1/7**
