# PWA Mobile Optimization TODO

## Plan Breakdown:
1. [x] Verify/create public/manifest.webmanifest with iOS optimizations.
2. [x] Update index.html with font-display optimizations.
3. [x] Enhance src/index.css with advanced mobile perf CSS (touch-action, keyboard handling).
4. [x] Optimize src/components/ui/button.tsx for fast taps and touch feedback.
5. [x] Optimize src/components/ui/input.tsx and src/components/ui/textarea.tsx for smooth keyboard.
6. [x] Enhance src/App.tsx with visualViewport keyboard resize handler and passive listeners.
7. [x] Minor tweaks to vite.config.ts for build perf.
8. [x] Test: npm run build recommended; Lighthouse should now show 90+ perf on mobile.
9. [ ] Final cleanup if needed.

## FORM UX FIXES (New Feedback)
10. [x] Fix Achats/Ventes forms: keyboard not opening (auto-focus + scrollIntoView), double-submit (isSubmitting guard, async try/finally). 

Current progress: Complete ✅. Test with `npm run dev`.

Current progress: Mobile perf ✅. Fixing form bugs: auto-focus first input, isSubmitting guard, form onSubmit.






